/*
 index.js - ESP3D WebUI about file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

import { h } from "preact"
import { T, Translate } from "../translations"
import { Page, esp3dSettings, globaldispatch, Action } from "../app"
import { SendCommand } from "../http"
import { Esp3dVersion } from "../version"
import { RefreshCcw, Github, UploadCloud } from "preact-feather"
import { SendPostHttp, cancelCurrentUpload, lastError } from "../http"

/*
 * Local variables
 *
 */

let browserInformation = ""
let dataStatus = {}
let uploadFiles
let pathUpload = "/files"

//from https://stackoverflow.com/questions/5916900/how-can-you-detect-the-version-of-a-browser
function getBrowserInformation() {
    var ua = navigator.userAgent,
        tem,
        M =
            ua.match(
                /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
            ) || []
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || []
        return "IE " + (tem[1] || "")
    }
    if (M[1] === "Chrome") {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/)
        if (tem != null)
            return tem
                .slice(1)
                .join(" ")
                .replace("OPR", "Opera")
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"]
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1])
    return M.join(" ")
}

/*
 * Update FW
 *
 */
function onClickUpdateFW() {
    console.log("Update FW")
    pathUpload = "/updatefw"
    document.getElementById("uploadControl").removeAttribute("multiple")
    document.getElementById("uploadControl").click()
    PrepareUpload()
}

/*
 * Update UI
 *
 */
function onClickUpdateUI() {
    console.log("Update UI")
    pathUpload = "/files"
    document.getElementById("uploadControl").setAttribute("multiple", "true")
    PrepareUpload()
}

function PrepareUpload() {
    document.getElementById("uploadControl").click()
    document.getElementById("uploadControl").onchange = () => {
        console.log("content changed")
        uploadFiles = document.getElementById("uploadControl").files
        let fileList =
            "<div style='text-align: left; overflow: hidden;text-overflow: ellipsis;'><ul>"
        for (let i = 0; i < uploadFiles.length; i++) {
            fileList += "<li>"
            fileList += uploadFiles[i].name
            fileList += "</li>"
        }
        fileList += "</ul></div>"
        //todo open dialog to confirm
        globaldispatch({
            type: Action.confirm_upload,
            msg: T("S30") + "<br/>" + fileList,
            nextaction: processUpload,
            nextaction2: cancelUpload,
        })
    }
}

/*
 * delete all upload information
 *
 */
function clearUploadInformation() {
    if (document.getElementById("uploadControl")) {
        console.log("clear upload info")
        document.getElementById("uploadControl").value = ""
    }
}

/*
 * Cancel upload silently
 * e.g: user pressed cancel before upload
 */
function cancelUpload() {
    clearUploadInformation()
    cancelCurrentUpload()
    globaldispatch({
        type: Action.renderAll,
    })
}

/*
 * Start upload
 *
 */
function processUpload() {
    console.log("Now uploading")
    var formData = new FormData()
    var url = pathUpload
    formData.append("path", "/")
    globaldispatch({
        type: Action.upload_progress,
        title: "S32",
        msg: null,
        progress: 0,
        nextaction: cancelUpload,
    })
    for (var i = 0; i < uploadFiles.length; i++) {
        var file = uploadFiles[i]
        var arg = "/" + file.name + "S"
        //append file size first to check updload is complete
        formData.append(arg, file.size)
        formData.append("myfile", file, "/" + file.name)
    }
    SendPostHttp(url, formData, successUpload, errorUpload, progressUpload)
}

/*
 * Upload sucess
 *
 */
function successUpload(response) {
    globaldispatch({
        type: Action.upload_progress,
        progress: 100,
    })
    console.log("success")
    clearUploadInformation()
    globaldispatch({
        type: Action.message,
        title: "S34",
        msg: "S35",
    })
    if (pathUpload == "/files") {
        setTimeout(location.reload, 3000)
    } else {
        //wait for restart due to websocket disconnection
        //so no need to reload
    }
}

/*
 * Upload failed
 *
 */
function errorUpload(errorCode, response) {
    console.log("error upload code : " + lastError.code + " " + errorCode)
    clearUploadInformation()
    if (!lastError.code && errorCode == 0) {
        cancelCurrentUpload(errorCode, response)
    }
}

/*
 * Upload progress
 *
 */
function progressUpload(oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = (oEvent.loaded / oEvent.total) * 100
        console.log(percentComplete.toFixed(0) + "%")
        globaldispatch({
            type: Action.upload_progress,
            progress: percentComplete.toFixed(0),
            title: "S32",
        })
    } else {
        // Impossible because size is unknown
    }
}

/*
 * Link for github ESP3D
 *
 */
function clickGitFW() {
    window.open("https://www.github.com/luc-github/ESP3D", "_blank")
}

/*
 * Link for github ESP3D-WEBUI
 *
 */
function clickGitUI() {
    window.open("https://www.github.com/luc-github/ESP3D-WEBUI", "_blank")
}

/*
 * About page
 *
 */
export const AboutPage = ({ currentState }) => {
    if (currentState.activePage != Page.about) return null
    if (browserInformation == "") {
        browserInformation = getBrowserInformation()
        loadStatus()
    }
    return (
        <div class="card-body">
            <h3 class="card-title">{T("S12")}</h3>
            <hr />
            <center>
                <div style="display:inline-block;text-align:left">
                    <div class="card-text">
                        <span class="text-info">{T("S16")}: </span>
                        {esp3dSettings.FWVersion}&nbsp;
                        <button
                            type="button"
                            title={T("S20")}
                            class="btn btn-primary"
                            onClick={clickGitFW}
                        >
                            <Github />
                            <span class="hide-low">{" " + T("S20")}</span>
                        </button>
                        &nbsp;
                        <button
                            type="button"
                            title={T("S25")}
                            class="btn btn-dark"
                            onClick={onClickUpdateFW}
                        >
                            <UploadCloud />
                            <span class="hide-low">{" " + T("S25")}</span>
                        </button>
                    </div>
                    <div style="height:2px" />
                    <div class="card-text">
                        <span class="text-info">{T("S17")}: </span>
                        <Esp3dVersion />
                        &nbsp;
                        <button
                            type="button"
                            title={T("S20")}
                            class="btn btn-primary"
                            onClick={clickGitUI}
                        >
                            <Github />
                            <span class="hide-low">{" " + T("S20")}</span>
                        </button>
                        &nbsp;
                        <button
                            type="button"
                            title={T("S25")}
                            class="btn btn-dark"
                            onClick={onClickUpdateUI}
                        >
                            <UploadCloud />
                            <span class="hide-low">{" " + T("S25")}</span>
                        </button>
                        <input type="file" class="d-none" id="uploadControl" />
                    </div>
                    <div style="height:2px" />
                    <div class="card-text" title={navigator.userAgent}>
                        <span class="text-info">{T("S18")}: </span>
                        {browserInformation}
                    </div>
                    {dataStatus.Status
                        ? dataStatus.Status.map((entry, index) => {
                              if (entry.id == "FW version") return null
                              return (
                                  <div class="card-text">
                                      <span class="text-info">
                                          {Translate(entry.id)}:{" "}
                                      </span>
                                      {Translate(entry.value)}
                                  </div>
                              )
                          })
                        : ""}
                </div>
            </center>
            <hr />
            <center>
                <button
                    type="button"
                    class="btn btn-primary"
                    title={T("S23")}
                    onClick={loadStatus}
                >
                    <RefreshCcw />
                </button>
            </center>
        </div>
    )
}

/*
 * Load Firmware Status
 */
function loadStatus() {
    const cmd = encodeURIComponent("[ESP420]")
    globaldispatch({
        type: Action.fetch_data,
    })
    console.log("load FW status")
    SendCommand(cmd, loadStatusSuccess, loadStatusError)
}

/*
 * Load Firmware Status query success
 */
function loadStatusSuccess(responseText) {
    try {
        dataStatus = JSON.parse(responseText)
        console.log("status :" + dataStatus.Status[0].id)
        globaldispatch({
            type: Action.renderAll,
        })
    } catch (e) {
        console.log(responseText)
        console.error("Parsing error:", e)
        globaldispatch({
            type: Action.error,
            errorcode: e,
            msg: "S21",
        })
    }
}

/*
 * Load Firmware Status query error
 */
function loadStatusError(errorCode, responseText) {
    globaldispatch({
        type: Action.error,
        errorcode: errorCode,
        msg: "S5",
    })
}