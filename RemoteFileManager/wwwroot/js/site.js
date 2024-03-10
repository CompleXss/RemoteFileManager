var diskSpaces = {}
var files = {}

var connection = new signalR.HubConnectionBuilder()
    .withUrl('/hub')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.None)
    .build()



// Api calls
function startDownloadRequest(downloadLink, directoryName, fileName) {
    return connection.invoke('StartDownload', downloadLink, directoryName, fileName)
}
function cancelDownloadRequest(id) {
    return connection.invoke('CancelDownload', id)
}
function pauseDownloadRequest(id) {
    return connection.invoke('PauseDownload', id)
}
function resumeDownloadRequest(id) {
    return connection.invoke('ResumeDownload', id)
}
function getDownloadAllowedDirectoryNamesRequest() {
    return connection.invoke('GetDownloadAllowedDirectoryNames')
}
function getEditAllowedDirectoryInfosRequest() {
    return connection.invoke('GetEditAllowedDirectoryInfos')
}
function getActiveDownloads() {
    return connection.invoke('GetActiveDownloads')
        .then(downloads => {
            const activeDownloads = document.getElementById('activeDownloads')
            if (!activeDownloads) {
                logElementNotFoundError('activeDownloads')
                return
            }

            // clear children
            activeDownloads.textContent = ''

            for (download of downloads) {
                if (!download.done)
                    spawnDownloadElement(download, activeDownloads)
            }
        })
}

// Get DOM elements
function getDownloadLinkElement() {
    return document.getElementById('downloadLink')
}
function getDownloadDirectoriesElement() {
    return document.getElementById('downloadDirectories')
}
function getDownloadFileNameElement() {
    return document.getElementById('downloadFileName')
}
function getActiveDownloadsElement() {
    return document.getElementById('activeDownloads')
}
function getCompletedDownloadsElement() {
    return document.getElementById('completedDownloads')
}
function getEditDirectoriesElement() {
    return document.getElementById('editDirectories')
}
function getFileToDeleteElement() {
    return document.getElementById('fileToDelete')
}



// Connect
function connect() {
    connection.onreconnecting(() => {
        console.log('Connection lost. Reconnecting...')
    })

    connection.onreconnected(() => {
        onConnected()
        console.log('Successfully reconnected.')
    })

    connection.onclose(() => {
        console.log('Connection closed. Reload page to connect again.')
    })

    addEventListeners(connection)

    connection.start()
        .then(() => {
            console.log('Successfully connected to server.')
            onConnected()
        })
        .catch(e => {
            console.log('Connection to server failed with error: ')
            console.log(e)
        })
}

function addEventListeners(connection) {
    connection.on('DownloadAdded', spawnDownloadElement)
    connection.on('DownloadRemoved', onDownloadRemoved)
    connection.on('DownloadPaused', onDownloadPaused)
    connection.on('DownloadResumed', onDownloadResumed)
    connection.on('DownloadUpdated', updateDownloadInfo)
    connection.on('DirectoryUpdated', onDirectoryUpdated)
    //connection.on('DiskSpaceUpdated', updateDiskSpace)
}

function onConnected() {
    reloadDownloadDirectories()
    reloadFileManager()
    getActiveDownloads()
}



// Download
function startDownload() {
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
    startDownloadRequest(downloadLink, directoryName, fileName)
}

function spawnDownloadElement(info, list) {
    if (!list) {
        list = getActiveDownloadsElement()
        if (!list) {
            logElementNotFoundError('activeDownloads')
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
    cancelButton.onclick = () => cancelDownloadRequest(info.id)

    // pause-resume button
    const pauseButton = document.createElement('button')
    if (info.paused) {
        pauseButton.className = 'resume_button'
        pauseButton.onclick = () => resumeDownloadRequest(info.id)
    }
    else {
        pauseButton.className = 'pause_button'
        pauseButton.onclick = () => pauseDownloadRequest(info.id)
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

    if (totalBytes == -1) { // if totalSize is unknown
        progress_bar.style.width = '100%'
        downloadInfo.textContent += getFileSizeString(bytesDownloaded) + ' / [???]'
    }
    else {
        progress_bar.style.width = (bytesDownloaded / totalBytes * 100).toString() + '%'
        downloadInfo.textContent += getDownloadProgressString(bytesDownloaded, totalBytes) +
            ', remaining: ' + getTimeRemainingString((totalBytes - bytesDownloaded) / speed)
    }
}

function onDownloadRemoved(downloadID, completed) {
    const completedDownloads = getCompletedDownloadsElement()
    if (!completedDownloads) {
        logElementNotFoundError('completedDownloads')
        return
    }

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
    btn.onclick = () => resumeDownloadRequest(downloadID)
}

function onDownloadResumed(downloadID) {
    const download = document.getElementById(downloadID)
    if (!download) return

    // btn: resume --> pause
    const btn = download.querySelector('.resume_button')
    btn.className = 'pause_button'
    btn.onclick = () => pauseDownloadRequest(downloadID)
}



// Directories
function reloadDownloadDirectories() {
    if (!connection) return

    const select = getDownloadDirectoriesElement()
    select.disabled = true

    return getDownloadAllowedDirectoryNamesRequest()
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

function editDirectoryOnChange(directoryName) {
    if (!directoryName) return

    showDiskSpace(directoryName)
    showFilesToDelete(directoryName)
}



// File management
function reloadFileManager() {
    const select = getEditDirectoriesElement()
    select.disabled = true

    getFileToDeleteElement().disabled = true

    return getEditAllowedDirectoryInfosRequest()
        .then(infos => {
            if (!infos) return

            // load dirs
            const options = infos.map(info => createOptionElement(info.directoryName))
            select.replaceChildren(...options)
            select.disabled = options.length === 0

            // load diskSpaces & files
            for (info of infos) {
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

function onDirectoryUpdated(directoryName, filesInfo, diskSpaceInfo) {
    diskSpaces[directoryName] = diskSpaceInfo
    files[directoryName] = filesInfo

    showDiskSpace()
    showFilesToDelete()
}



// TODO: deleteFile
function deleteFile() {
    const directoryName = getEditDirectoriesElement()?.value
    const fileToDelete = getFileToDeleteElement()?.value

    if (!directoryName || !fileToDelete || directoryName == '' || fileToDelete == '') return

    // TODO: confirm delete window

    // TODO: delete file
}



// Other
function clearCompletedDownloads() {
    const list = getCompletedDownloadsElement()
    if (!list) {
        logElementNotFoundError(list)
        return
    }

    list.textContent = ''
}





// Formatters
function getFileSizeString(value) {
    const kiloByte = 1024
    const megaByte = kiloByte * 1024
    const gigaByte = megaByte * 1024
    const teraByte = gigaByte * 1024

    if (value > teraByte)
        return format(value / teraByte) + ' TB'

    if (value > gigaByte)
        return format(value / gigaByte) + ' GB'

    if (value > megaByte)
        return format(value / megaByte) + ' MB'

    if (value > kiloByte)
        return format(value / kiloByte) + ' KB'

    return format(value) + ' B'



    function format(value) {
        return value >= 100
            ? Math.floor(value).toFixed(0)
            : (Math.floor(value * 10) / 10).toFixed(1)
    }
}

function getDownloadProgressString(downloaded, total) {
    const kiloByte = 1024
    const megaByte = kiloByte * 1024
    const gigaByte = megaByte * 1024
    const teraByte = gigaByte * 1024

    if (total > teraByte)
        return format(downloaded / teraByte) + '/' + format(total / teraByte) + ' TB'

    if (total > gigaByte)
        return format(downloaded / gigaByte) + '/' + format(total / gigaByte) + ' GB'

    if (total > megaByte)
        return format(downloaded / megaByte) + '/' + format(total / megaByte) + ' MB'

    if (total > kiloByte)
        return format(downloaded / kiloByte) + '/' + format(total / kiloByte) + ' KB'

    return downloaded.toFixed(0) + '/' + total.toFixed(0) + ' B'



    function format(value) {
        return value > 100
            ? (value).toFixed(0)
            : (value).toFixed(1)
    }
}

function getTimeRemainingString(value) {
    const min = 60
    const hour = min * 60
    const day = hour * 24
    const week = day * 7
    const month = week * 4
    const year = month * 12
    const inf = year * 10

    if (value > inf)
        return 'inf.'

    if (value > year)
        return format(value / year) + ' y.'

    if (value > month)
        return format(value / month) + ' m.'

    if (value > week)
        return format(value / week) + ' w.'

    if (value > day)
        return format(value / day) + ' d.'

    if (value > hour)
        return format(value / hour) + ' h.'

    if (value > min)
        return format(value / min) + ' min.'

    return value.toFixed(1) + ' sec.'



    function format(value) {
        return value > 100
            ? value.toFixed(0)
            : value.toFixed(1)
    }
}



// TODO: get rid of logElementNotFoundError?
function logElementNotFoundError(elementName) {
    console.error(`Can not find "${elementName}" element!`)
}
