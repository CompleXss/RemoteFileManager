import { SignalrConnection } from "../common/signalrConnection.js";
import { ConnectionApiCaller } from './connectionApiCaller.js'
import { getDownloadProgressString, getFileSizeString, getTimeRemainingString } from './formatters.js'
import {
    getActiveDownloadsElement,
    getCompletedDownloadsElement,
    getDownloadDirectoriesElement,
    getDownloadFileNameElement,
    getDownloadLinkElement,
    getEditDirectoriesElement,
    getFileToDeleteElement
} from "./domElements.js";


const diskSpaces = {}
const files = {}

const connection = new SignalrConnection('/file-manager', onConnected)
const api = new ConnectionApiCaller(connection)

addEventListeners(connection)


export function getActiveDownloads() {
    api.getActiveDownloadsRequest()
        .then(downloads => {
            const activeDownloads = getActiveDownloadsElement()

            // clear children
            activeDownloads.textContent = ''

            for (const download of downloads) {
                if (!download.done)
                    spawnDownloadElement(download, activeDownloads)
            }
        })
}


// Connect
export async function connectFileManager() {
    return await connection.start()
}

function addEventListeners(connection) {
    connection.on('DownloadAdded', spawnDownloadElement)
    connection.on('DownloadRemoved', onDownloadRemoved)
    connection.on('DownloadPaused', onDownloadPaused)
    connection.on('DownloadResumed', onDownloadResumed)
    connection.on('DownloadUpdated', updateDownloadInfo)
    connection.on('DirectoryUpdated', onDirectoryUpdated)
    connection.on('ShouldReloadDirectories', () => {
        reloadDownloadDirectories()
        reloadFileManager()
    })
}

function onConnected() {
    reloadDownloadDirectories()
    reloadFileManager()
    getActiveDownloads()
}


// Download
export function startDownload() {
    if (!connection) return

    // get download link
    const downloadLink = getDownloadLinkElement()?.value
    if (!downloadLink || downloadLink === '') return

    // get directoryName
    const directoryName = getDownloadDirectoriesElement()?.value
    if (!directoryName || directoryName === '') {
        console.log('Could not get directory name. Download request aborted.')
        return
    }

    // get fileName
    const fileName = getDownloadFileNameElement()?.value

    // request download
    api.startDownloadRequest(downloadLink, directoryName, fileName)
}

function spawnDownloadElement(info, list) {
    if (!list) {
        list = getActiveDownloadsElement()
        if (!list) {
            return
        }
    }

    // main download object
    const download = document.createElement('div')
    download.id = info.id
    download.className = 'download'

    // text
    const directoryName = document.createElement('p')
    directoryName.className = 'directory_name'
    directoryName.textContent = info.directoryName

    const fileName = document.createElement('p')
    fileName.textContent = info.fileName
    fileName.title = info.fileName

    // progress bar
    const progress_bar = document.createElement('div')
    progress_bar.className = 'progress_bar'

    const progress = document.createElement('div')
    progress.className = 'progress'
    progress.appendChild(progress_bar)

    // download info
    const downloadInfo = document.createElement('p')
    downloadInfo.className = 'downloadInfo'
    downloadInfo.textContent = '\0'

    // cancel button
    const cancelButton = document.createElement('button')
    cancelButton.className = 'cancel_button'
    cancelButton.onclick = () => api.cancelDownloadRequest(info.id)

    // pause-resume button
    const pauseButton = document.createElement('button')
    if (info.paused) {
        pauseButton.className = 'resume_button'
        pauseButton.onclick = () => api.resumeDownloadRequest(info.id)
    } else {
        pauseButton.className = 'pause_button'
        pauseButton.onclick = () => api.pauseDownloadRequest(info.id)
    }

    // wrappers
    const text_wrapper = document.createElement('div')
    text_wrapper.className = 'text_wrapper'
    text_wrapper.appendChild(directoryName)
    text_wrapper.appendChild(fileName)

    const top_wrapper = document.createElement('div')
    top_wrapper.className = 'top_wrapper'
    top_wrapper.appendChild(text_wrapper)
    top_wrapper.appendChild(pauseButton)
    top_wrapper.appendChild(cancelButton)


    // append all children to base
    download.appendChild(top_wrapper)
    download.appendChild(progress)
    download.appendChild(downloadInfo)
    list.appendChild(download)

    updateDownloadInfo(info.id, info.bytesDownloaded, info.totalBytes, info.speed, download)
}

function updateDownloadInfo(downloadID, bytesDownloaded, totalBytes, speed, download) {
    if (!download) {
        download = document.getElementById(downloadID)
        if (!download) return
    }

    const progress_bar = download.querySelector('.progress_bar')
    const downloadInfo = download.querySelector('.downloadInfo')
    downloadInfo.textContent = getFileSizeString(speed) + '/s – '

    if (totalBytes === -1) { // if totalSize is unknown
        progress_bar.style.width = '100%'
        downloadInfo.textContent += getFileSizeString(bytesDownloaded) + ' / [???]'
    } else {
        progress_bar.style.width = (bytesDownloaded / totalBytes * 100).toString() + '%'
        downloadInfo.textContent += getDownloadProgressString(bytesDownloaded, totalBytes) +
            ', remaining: ' + getTimeRemainingString((totalBytes - bytesDownloaded) / speed)
    }
}

function onDownloadRemoved(downloadID, completed) {
    const completedDownloads = getCompletedDownloadsElement()
    if (!completedDownloads) return

    const download = document.getElementById(downloadID)
    if (!download) return

    download.removeAttribute('id')
    completedDownloads.prepend(download)

    // modify download look
    const progress_bar = download.querySelector('.progress_bar')
    progress_bar.style.background = completed ? 'green' : 'red';
    progress_bar.style.width = '100%'

    // btn: cancel download --> remove element from list
    const cancel_button = download.querySelector('.cancel_button')
    cancel_button.onclick = () => download.remove()

    download.querySelector('.downloadInfo')?.remove()
    download.querySelector('.pause_button')?.remove()
    download.querySelector('.resume_button')?.remove()
}

function onDownloadPaused(downloadID) {
    const download = document.getElementById(downloadID)
    if (!download) return

    // btn: pause --> resume
    const btn = download.querySelector('.pause_button')
    btn.className = 'resume_button'
    btn.onclick = () => api.resumeDownloadRequest(downloadID)
}

function onDownloadResumed(downloadID) {
    const download = document.getElementById(downloadID)
    if (!download) return

    // btn: resume --> pause
    const btn = download.querySelector('.resume_button')
    btn.className = 'pause_button'
    btn.onclick = () => api.pauseDownloadRequest(downloadID)
}


// Directories
export function reloadDownloadDirectories() {
    if (!connection) return

    const select = getDownloadDirectoriesElement()
    select.disabled = true

    return api.getDownloadAllowedDirectoryNamesRequest()
        .then(directoryNames => {
            const options = directoryNames.map(createOptionElement)

            select.replaceChildren(...options)
            select.disabled = options.length === 0
        })
}

function createOptionElement(value) {
    const option = document.createElement('option')
    option.textContent = value
    option.value = value

    return option
}


// Disk space
function showDiskSpace(directoryName) {
    directoryName ??= getEditDirectoriesElement().value
    if (!directoryName) return

    const diskSpace = diskSpaces[directoryName]

    const progress_bar = document.getElementById('disk_space_progress_bar')
    const spaceUsed = (100 - (diskSpace.free / diskSpace.total) * 100)
    progress_bar.style.width = spaceUsed.toString() + '%'
    progress_bar.style.backgroundColor = spaceUsed > 90 ? 'red' : ''

    const text = document.getElementById('disk_space')
    text.textContent =
        getFileSizeString(diskSpace.free) +
        ' available of ' +
        getFileSizeString(diskSpace.total)
}

export function editDirectoryOnChange(directoryName) {
    if (!directoryName) return

    showDiskSpace(directoryName)
    showFilesToDelete(directoryName)
}


// File management
export function reloadFileManager() {
    const select = getEditDirectoriesElement()
    select.disabled = true

    getFileToDeleteElement().disabled = true

    return api.getAllowedDirectoryInfosRequest()
        .then(infos => {
            if (!infos) return

            // load dirs
            const options = infos.map(info => createOptionElement(info.directoryName))
            select.replaceChildren(...options)
            select.disabled = options.length === 0

            // load diskSpaces & files
            for (const info of infos) {
                diskSpaces[info.directoryName] = info.diskSpaceInfo
                files[info.directoryName] = info.files
            }

            showDiskSpace()
            showFilesToDelete()
        })
        .catch(e => console.log(e.message))
}

function showFilesToDelete(directoryName) {
    directoryName ??= getEditDirectoriesElement()?.value
    if (!directoryName) return

    const select = getFileToDeleteElement()
    const options = files[directoryName]
        .map(file => {
            file.lastModifiedTime = new Date(file.lastModifiedTime).toLocaleString()
            return file
        })
        .map(file => file.name) // TODO: show not only fileName but also lastModifiedTime
        .map(createOptionElement)

    select.replaceChildren(...options)
    select.disabled = options.length === 0
}

function onDirectoryUpdated(directoryName, diskSpaceInfo, filesInfo) {
    diskSpaces[directoryName] = diskSpaceInfo
    files[directoryName] = filesInfo

    showDiskSpace()
    showFilesToDelete()
}


export function deleteFile() {
    const directoryName = getEditDirectoriesElement()?.value
    const fileName = getFileToDeleteElement()?.value

    if (!directoryName || !fileName || directoryName == '' || fileName == '') return

    if (confirm(`Are you sure you want to DELETE the file '${fileName}' from '${directoryName}'?`)) {
        api.deleteFileRequest(directoryName, fileName)
    }
}


// Other
export function clearCompletedDownloads() {
    const list = getCompletedDownloadsElement()
    if (!list) return

    list.textContent = ''
}
