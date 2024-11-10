const kiloByte = 1024
const megaByte = kiloByte * 1024
const gigaByte = megaByte * 1024
const teraByte = gigaByte * 1024


/**
 * Returns a string representing file size value.
 * Example: 10 MB
 * @param {number} value file size in bytes
 */
export function getFileSizeString(value) {
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

/**
 * Returns a string representing file download progress.
 * Example: 5.5/10 MB
 * @param {number} downloaded size in bytes
 * @param {number} total size in bytes
 */
export function getDownloadProgressString(downloaded, total) {
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

/**
 * Returns a string representing time left to do smth.
 * Example: 20 min.
 * @param {number} seconds
 */
export function getTimeRemainingString(seconds) {
    const min = 60
    const hour = min * 60
    const day = hour * 24
    const week = day * 7
    const month = week * 4
    const year = month * 12
    const inf = year * 10

    if (seconds > inf)
        return 'inf.'

    if (seconds > year)
        return format(seconds / year) + ' y.'

    if (seconds > month)
        return format(seconds / month) + ' mo.'

    if (seconds > week)
        return format(seconds / week) + ' w.'

    if (seconds > day)
        return format(seconds / day) + ' d.'

    if (seconds > hour)
        return format(seconds / hour) + ' hr.'

    if (seconds > min)
        return format(seconds / min) + ' min.'

    return seconds.toFixed(1) + ' sec.'



    function format(value) {
        return value > 100
            ? value.toFixed(0)
            : value.toFixed(1)
    }
}