/*
SpindleCNC.js - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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

import { Fragment, h } from "preact"
import { T } from "../Translations"
import { Target } from "preact-feather"
import { useUiContext, useUiContextFn } from "../../contexts"
import { useTargetContext, variablesList } from "../../targets"
import { ButtonImg } from "../Controls"
import { useHttpFn } from "../../hooks"
import { espHttpURL, replaceVariables } from "../Helpers"

/*
 * Local const
 *
 */

const SpindleControls = () => {
    const { states } = useTargetContext()
    if (!useUiContextFn.getValue("showspindlepanel")) return null

    const states_array = [
        { id: "F", label: "CN9" },
        { id: "S", label: "CN64" },
    ]
    return (
        <Fragment>
            {states && (states.F || states.S) && (
                <div class="status-ctrls">
                    {states_array.map((element) => {
                        if (states[element.id]) {
                            return (
                                <div
                                    class="extra-control mt-1 tooltip tooltip-bottom"
                                    data-tooltip={T(element.label)}
                                >
                                    <div class="extra-control-header">
                                        {T(element.label)}
                                    </div>

                                    <div class="extra-control-value">
                                        {states[element.id].value}
                                    </div>
                                </div>
                            )
                        }
                    })}
                </div>
            )}
        </Fragment>
    )
}

const SpindlePanel = () => {
    const { toasts, panels } = useUiContext()
    const { createNewRequest } = useHttpFn
    const id = "SpindlePanel"
    const hidePanel = () => {
        useUiContextFn.haptic()
        panels.hide(id)
    }

    const buttons_list = [
        /*   {
            label: "CN67",
            buttons: [
                {
                    label: "-10%",
                    tooltip: "CN67",
                    command: "#SSO-10#",
                },
                {
                    label: "-1%",
                    tooltip: "CN67",
                    command: "#SSO-1#",
                },
                {
                    label: "100%",
                    tooltip: "CN66",
                    command: "#SSO100#",
                },
                {
                    iconRight: true,
                    label: "+1%",
                    tooltip: "CN67",
                    command: "#SSO+1#",
                },
                {
                    iconRight: true,
                    label: "+10%",
                    tooltip: "CN67",
                    command: "#SSO+10#",
                },
            ],
        },
*/
    ]

    console.log("Spindle panel")
    const sendCommand = (command) => {
        createNewRequest(
            espHttpURL("command", {
                cmd: replaceVariables(variablesList.commands, command),
            }),
            { method: "GET", echo: command },
            {
                onSuccess: (result) => {},
                onFail: (error) => {
                    toasts.addToast({ content: error, type: "error" })
                    console.log(error)
                },
            }
        )
    }
    return (
        <div class="panel panel-dashboard">
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Target />
                    <strong class="text-ellipsis">{T("CN36")}</strong>
                </span>
                <span class="navbar-section">
                    <span style="height: 100%;">
                        <span
                            class="btn btn-clear btn-close m-1"
                            aria-label="Close"
                            onclick={hidePanel}
                        />
                    </span>
                </span>
            </div>
            <div class="panel-body panel-body-dashboard">
                <SpindleControls />
                {buttons_list.map((item) => {
                    return (
                        <fieldset class="fieldset-top-separator fieldset-bottom-separator field-group">
                            <legend>
                                <label class="m-1 buttons-bar-label">
                                    {T(item.label)}
                                </label>
                            </legend>
                            <div class="field-group-content maxwidth">
                                <div class="states-buttons-container">
                                    {item.buttons.map((button) => {
                                        return (
                                            <ButtonImg
                                                icon={button.icon}
                                                iconRight={button.iconRight}
                                                label={T(button.label)}
                                                tooltip
                                                data-tooltip={T(button.tooltip)}
                                                onClick={(e) => {
                                                    useUiContextFn.haptic()
                                                    e.target.blur()
                                                    sendCommand(button.command)
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        </fieldset>
                    )
                })}
            </div>
        </div>
    )
}

const SpindlePanelElement = {
    id: "SpindlePanel",
    content: <SpindlePanel />,
    name: "CN36",
    icon: "Target",
    show: "showspindlepanel",
    onstart: "openspindleonstart",
}

export { SpindlePanel, SpindlePanelElement, SpindleControls }