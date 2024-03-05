var connection = new signalR.HubConnectionBuilder()
    .withUrl('/hub')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.None)
    .build()

function cancelDownload(id) {
    return connection.invoke('CancelDownload', id)
}
function pauseDownload(id) {
    return connection.invoke('PauseDownload', id)
}
function resumeDownload(id) {
    return connection.invoke('ResumeDownload', id)
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
function getDiskSpace(directoryName) {
    // TODO getDiskSpace

    connection.invoke('GetDiskSpaceInfo', directoryName)
        .then(info => {
            console.log(info)

            if (!info) {
                console.log('none')
            }
            else {
                console.log('free: ' + getFileSizeString(info.free))
                console.log('total: ' + getFileSizeString(info.total))
            }
        })
}



function connect() {
    connection.onreconnecting(() => {
        console.log('Connection lost. Reconnecting...')
    })

    connection.onreconnected(() => {
        console.log('Successfully reconnected.')
    })

    connection.onclose(() => {
        console.log('Connection closed. Reload page to connect again.')
    })

    addEventListeners(connection)

    connection.start()
        .then(() => {
            console.log('Successfully connected to server.')
            getActiveDownloads()
        })
        .catch(e => {
            console.log('Connection to server failed with error: ')
            console.log(e)
        })
}

function addEventListeners(connection) {
    const completedDownloads = document.getElementById('completedDownloads')
    if (!completedDownloads) {
        logElementNotFoundError('completedDownloads')
        return
    }

    connection.on('DownloadAdded', spawnDownloadElement)
    connection.on('DownloadUpdated', updateDownloadInfo)
    connection.on('DiskSpaceUpdated', updateDiskSpaceInfo)



    connection.on('DownloadRemoved', (downloadID, completed) => {
        const download = document.getElementById(downloadID)
        if (!download) return

        download.removeAttribute('id')
        completedDownloads.prepend(download)

        // modify download look
        const progress_bar = download.querySelector('.progress_bar')
        progress_bar.style.background = completed ? 'green' : 'red';
        progress_bar.style.width = '100%'

        const cancel_button = download.querySelector('.cancel_button')
        cancel_button.onclick = () => download.remove()

        download.querySelector('.downloadInfo')?.remove()
        download.querySelector('.pause_button')?.remove()
        download.querySelector('.resume_button')?.remove()
    })



    connection.on('DownloadPaused', downloadID => {
        const download = document.getElementById(downloadID)
        if (!download) return

        const btn = download.querySelector('.pause_button')
        btn.className = 'resume_button'
        btn.onclick = () => resumeDownload(downloadID)
    })



    connection.on('DownloadResumed', downloadID => {
        const download = document.getElementById(downloadID)
        if (!download) return

        const btn = download.querySelector('.resume_button')
        btn.className = 'pause_button'
        btn.onclick = () => pauseDownload(downloadID)
    })
}



function updateDownloadInfo(downloadID, bytesDownloaded, totalBytes, speed, download) {
    if (!download) {
        download = document.getElementById(downloadID)
        if (!download) return
    }

    const progress_bar = download.querySelector('.progress_bar')
    const downloadInfo = download.querySelector('.downloadInfo')
    downloadInfo.textContent = getFileSizeString(speed) + '/s – '

    if (totalBytes == -1) {
        progress_bar.style.width = '100%'
        downloadInfo.textContent += getFileSizeString(bytesDownloaded) + ' / [???]'
    }
    else {
        progress_bar.style.width = (bytesDownloaded / totalBytes * 100).toString() + '%'
        downloadInfo.textContent += getDownloadProgress(bytesDownloaded, totalBytes) +
            ', remaining: ' + getTimeRemainingString((totalBytes - bytesDownloaded) / speed)
    }
}

function updateDiskSpaceInfo(directoryName, info) {
    if (!info) return

    // TODO updateDiskSpaceInfo

    console.log(directoryName)
    console.log(getFileSizeString(info.free))
    console.log(getFileSizeString(info.total))
}



function startDownload() {
    if (!connection) return

    // get download link
    const downloadLink = document.getElementById('downloadLink')?.value
    if (!downloadLink || downloadLink === '') return

    // get directoryName
    const directoryName = document.getElementById('downloadDirectories')?.value
    if (!directoryName || directoryName === '') {
        console.log('Can not get directory name. Download request aborted.')
        return
    }

    // get fileName
    const fileName = document.getElementById('downloadFileName')?.value

    // request download
    connection.invoke('StartDownload', downloadLink, directoryName, fileName)
}

function spawnDownloadElement(info, list) {
    if (!list) {
        list = document.getElementById('activeDownloads')
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
    cancelButton.onclick = () => cancelDownload(info.id)

    // pause-resume button
    const pauseButton = document.createElement('button')
    if (info.paused) {
        pauseButton.className = 'resume_button'
        pauseButton.onclick = () => resumeDownload(info.id)
    }
    else {
        pauseButton.className = 'pause_button'
        pauseButton.onclick = () => pauseDownload(info.id)
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



function getFileNames() {
    const directoryName = document.getElementById('editDirectories')?.value
    if (!directoryName || directoryName === '') {
        console.log('Can not get directory name. GetFileNames request aborted.')
        return
    }

    connection.invoke('GetFilesInDirectoryByName', directoryName)
        .then(files => {
            files.map(x => {
                x.lastModifiedTime = new Date(x.lastModifiedTime).toLocaleString()
                return x
            })
            console.log(files)
        })
}



function reloadDownloadDirectories() {
    reloadDirectories('downloadDirectories', 'GetDownloadAllowedDirectoryNames')
}

function reloadEditDirectories() {
    reloadDirectories('editDirectories', 'GetEditAllowedDirectoryNames')
}

function reloadDirectories(elementID, endpointName) {
    if (!connection) return

    const select = document.getElementById(elementID)
    select.disabled = true

    connection.invoke(endpointName)
        .then(directories => {
            const options = directories.map(dir => {
                const option = document.createElement('option')
                option.textContent = dir
                option.value = dir

                return option
            })

            select.replaceChildren(...options)
            select.disabled = false
        })
}

function clearCompletedDownloads() {
    const list = document.getElementById('completedDownloads')
    if (!list) {
        logElementNotFoundError(list)
        return
    }

    list.textContent = ''
}






function getFileSizeString(value) {
    const kiloByte = 1024
    const megaByte = kiloByte * 1024
    const gigaByte = megaByte * 1024
    const teraByte = gigaByte * 1024

    if (value > teraByte) {
        return (value / teraByte).toFixed(1) + ' TB'
    }

    if (value > gigaByte) {
        return (value / gigaByte).toFixed(1) + ' GB'
    }

    if (value > megaByte) {
        return (value / megaByte).toFixed(1) + ' MB'
    }

    if (value > kiloByte) {
        return (value / kiloByte).toFixed(1) + ' KB'
    }

    return value.toFixed(1) + ' B'
}

function getTimeRemainingString(value) {
    const min = 60
    const hour = min * 60
    const day = hour * 24
    const week = day * 7
    const month = week * 4
    const year = month * 12
    const inf = year * 10

    if (value > inf) {
        return 'inf.'
    }

    if (value > year) {
        return (value / year).toFixed(1) + ' y.'
    }

    if (value > month) {
        return (value / month).toFixed(1) + ' m.'
    }

    if (value > week) {
        return (value / week).toFixed(1) + ' w.'
    }

    if (value > day) {
        return (value / day).toFixed(1) + ' d.'
    }

    if (value > hour) {
        return (value / hour).toFixed(1) + ' h.'
    }

    if (value > min) {
        return (value / min).toFixed(1) + ' min.'
    }

    return value.toFixed(1) + ' s.'
}

function getDownloadProgress(downloaded, total) {
    const kiloByte = 1024
    const megaByte = kiloByte * 1024
    const gigaByte = megaByte * 1024
    const teraByte = gigaByte * 1024

    if (total > teraByte) {
        return divide(downloaded, teraByte) + '/' + divide(total, teraByte) + ' TB'
    }

    if (total > gigaByte) {
        return divide(downloaded, gigaByte) + '/' + divide(total, gigaByte) + ' GB'
    }

    if (total > megaByte) {
        return divide(downloaded, megaByte) + '/' + divide(total, megaByte) + ' MB'
    }

    if (total > kiloByte) {
        return divide(downloaded, kiloByte) + '/' + divide(total, kiloByte) + ' KB'
    }

    return downloaded.toFixed(1) + '/' + total.toFixed(1) + ' B'



    function divide(value, divider) {
        return (value / divider).toFixed(1)
    }
}

function logElementNotFoundError(elementName) {
    console.error(`Can not find "${elementName}" element!`)
}
