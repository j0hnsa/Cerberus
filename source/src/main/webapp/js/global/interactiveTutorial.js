/*
 * Cerberus Copyright (C) 2013 - 2017 cerberustesting
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This file is part of Cerberus.
 *
 * Cerberus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cerberus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cerberus.  If not, see <http://www.gnu.org/licenses/>.
 */

$(document).ready(function () {
    $("#openInteractiveTutoModal").off("click");
    $("#openInteractiveTutoModal").click(function () {
        // remove all into the modal
        $("#interactiveTutoList").html("");

        $.get('api/interactiveTuto/list',
            function (data, status) {
                if(status==='success') {
                    data.forEach(function (data) {
                        createNewButtonOnTutoShowroom(data.id, data.title, data.description, data.role, data.level);
                    });
                } else {
                    console.error('api/interactiveTuto/list respond with error' + status);
                }
            });

        $('#interactiveTutoModal').modal();
    });

    if(getUrlParameter("tutorielId") !== undefined) {
        let tutorielId = getUrlParameter("tutorielId");
        console.log(tutorielId);
        let startStep = getUrlParameter("startStep");
        interractiveTutorial(tutorielId, startStep);
    }

});

function createNewButtonOnTutoShowroom(id, title, description, role, level) {

    if($('#'+role).length === 0) { // verify if element exit
        $("#interactiveTutoList").append("<div id="+role+"><h3>"+role+"</h3></div>");
    }

    let levelstr = "easy";
    let badgecolor="success";
    if(level==2)  { levelstr = "medium"; badgecolor="warning";}
    if(level==3)  { levelstr = "hard"; badgecolor="danger";}

    // populate the modal
    $('#'+role).append(
        "<div class='row' style='margin-top:5px;'>" +
        "   <div class='col-xs-5'>" +
        "       <button id='tuto"+id+"' type=\"button\" class=\"btn btn-default col-xs-12\" data-dismiss=\"modal\" " + "name=\"buttonClose\">"+title+"</button>" +
        "   </div>" +
        "   <div class='col-xs-1 label label-"+badgecolor+"' style='margin-top: 8px;font-size:100%'>"+levelstr+"</div>" +
        "   <div class=\"col-xs-6\">" +
        "       <span class='col-xs-12' style='margin-top: 8px;padding:0pxs'>"+description+"" + "</span>" +
        "   </div>" +
        "</div>");

    $('#tuto'+id).click(function() {
        interractiveTutorial(id);
    })

}

function interractiveTutorial(id, startStep=1) {console.log("coucou");

    $.get('api/interactiveTuto/get', {
        id : id
    }, function (data, status) {
        if(status!='success') {
            console.error('api/interactiveTuto/get respond with error' + status);
            return;
        }
        let cerberusTuto = new CerberusTuto(data.id);

        if(data.steps == null || data.steps.length <= 0) {
            cerberusTuto.addGeneralMessage("Tutoriel is being written  ...");
        } else {
            data.steps.forEach(function (step) {
                switch (step.type) {
                    case 'GENERAL' :
                        cerberusTuto.addGeneralMessage(step.text);
                        break;
                    case 'CHANGE_PAGE_AFTER_CLICK' :
                        cerberusTuto.addMessageAndChangePageAfterClick(step.selectorJquery, step.text, step.attr1);
                        break;
                    default :
                        cerberusTuto.addMessage(step.selectorJquery, step.text);
                        break;
                }
            });
        }

        cerberusTuto.start(startStep);
    });
}


function firstConnexion() {
    let cerberusTuto = new CerberusTuto(0);


    cerberusTuto.addGeneralMessage("Bienvenue dans Cerberus ! Je vois que c'est ta première connexion, veux tu que je te guide dans tes premiers pas ?");
    cerberusTuto.addGeneralMessage("Bienvenue sur la page d'accueil de cerberus ! <b>Sur cette page d’accueil, tu trouveras des informations sur</b>" +
        "<ul>" +
        "   <li>les cas de tests par application regroupés par status</li>" +
        "   <li>les dernières executions par tag</li>" +
        "   <li>les versions des applications déployées par environnement</li>" +
        "</ul>");

    cerberusTuto.addGeneralMessage("TODO, 2 choix = rediriger sur tuto admin ou tuto création dun cas de test. Pour le moment juste l'admin est créé");

    cerberusTuto.addMessageAndChangePageAfterClick("#sidebar", "Vous êtes administrateur ! La 1ere étape de configuration est de créer un système. " +
        "Un <strong>système</strong> est une application métier ou CI. Rendez vous dans le menu <b>Administration/Invariants.</b>","#menuInvariants");

    // Page invariant
    cerberusTuto.addMessage("#createInvariantButton", "Clique sur Creer un invariant");
    cerberusTuto.addMessage("#idname", "Selectionne SYSTEM- dans la liste");
    cerberusTuto.addMessage("#value", "Donne un nom à ton systeme");
    cerberusTuto.addMessage("#addInvariantButton", "Et valide ton nouveau systeme");
    cerberusTuto.addMessageAndChangePageAfterClick("#sidebar", "Voilà, ton sytème est créé ! Prochaine étape : il faut créez un environnement. L'<b>environement</b>" +
        " represente une plateforme de test, ex : INTEGRATION ou PREPRODUCTION." +
        " Rendez-vous dans le menu <b>Integration/Environment</b>", "#menuEnvironments");

    cerberusTuto.start(startStep);

}

class CerberusTuto {

    constructor(tutorialId) {
        this.tutorialId=tutorialId;
        this.listMessage = new Array();
        this.cpt=1;
    }

    addGeneralMessage(messageStr) {
        let message = {
            intro : messageStr,
            step : this.cpt,
            type : 'general'
        };
        this.listMessage.push(message);

        this.cpt++;
    }

    addMessage(jqueryId, messageStr) {
        let message = {
            element : jqueryId,
            elementStr : jqueryId,
            intro : messageStr,
            step : this.cpt,
            type : 'default'
        };


        this.listMessage.push(message);
        this.cpt++;
    }

    addMessageAndChangePageAfterClick(jqueryId, messageStr, idLink) {
        this.addMessage(jqueryId, messageStr);
        this.listMessage[this.listMessage.length-1].type='changeAfterClick';
        this.listMessage[this.listMessage.length-1].idLink=idLink;
    }

    start(startStep=1) {
        if(startStep<=0)startStep=0;

        this.intro = introJs();
        this.listMessageToUse = this.listMessage.slice(startStep-1);
        this.intro.setOptions({steps:this.listMessageToUse});

        let _this=this;

        // correct a bug into introJs. If element use "nth-child" selector,  we have to
        // initialize and find it manually it before a change
        this.intro.onbeforechange(function (targetElement) {

            if(this._options.steps[this._currentStep].element != undefined && this._options.steps[this._currentStep].element.indexOf("nth-child") !== -1) {
                let elmt = $(this._options.steps[this._currentStep].elementStr);
                this._introItems[this._currentStep].position=null;
                this._introItems[this._currentStep].element = document.querySelector(this._options.steps[this._currentStep].element);
            }
        });

        this.intro.onchange(function (targetElement) {
            let intro = this;

            var clickOnNextStep = function (targetElement) {
                console.log("balbalkgzefokroferfre");
                if (intro != undefined) {
                    waitForElementToDisplay(intro._options.steps[intro._currentStep + 1].element, 100, function () {
                        intro.nextStep();
                    });
                }
            }

            if ($(targetElement).is("button")) { // if current element is a button
                $(targetElement).find("button").unbind("click.clickOnNextStep");
                $(targetElement).bind("click.clickOnNextStep", clickOnNextStep);
            } else { // else, for each button into the element
                $(targetElement).find("button").each(function (index, value) {
                    $(value).find("button").unbind("click.clickOnNextStep");
                    $(value).bind("click.clickOnNextStep", clickOnNextStep);
                });

                $(document).on('DOMNodeInserted', function (e) {
                    $(e.target).find("button").unbind("click.clickOnNextStep");
                    $(e.target).find("button").bind("click.clickOnNextStep", clickOnNextStep);
                });
                // TODO ecouter les autre bouton qui appariasserait pour ajouter l'action clikc
            }

            // add the step and tutorial number on link to follow the tutorial throw web pages
            let message = _this.listMessage[intro._currentStep+parseInt(startStep)-1];
            // if we want change page after the click, we have to added
            if(message.type==='changeAfterClick') {
                if ($(message.idLink) === undefined) {
                    console.log("Element " + message.idLink + " is undefined");
                } else {
                    let typeObj = $(message.idLink).prop('nodeName');
                    if (typeObj != undefined) {
                        switch (typeObj.toLowerCase()) {
                            case "button" :
                            case "form" : // cas du form sans action, ne marchera pas avec un action
                                let url = window.location.href;

                                // get part after ?
                                let getterParams = url.substr(url.indexOf("?") + 1, url.length - 1).split("&");

                                // construct new url
                                let newurl = "?";
                                getterParams.forEach(function (param) {
                                    let paramTab = param.split("=");
                                    switch (paramTab[0]) {
                                        case 'tutorielId' :
                                            newurl += "&tutorielId=" + _this.tutorialId;
                                            break;
                                        case 'startStep' :
                                            newurl += "&startStep=" + (message.step + 1);
                                            break;
                                        default :
                                            newurl += "&" + param;
                                            break;
                                    }
                                });

                                window.history.pushState(null, "", newurl);

                                break;
                            case "a" :
                                let symboleAdd = $(message.idLink).attr("href").includes("?") ? "&" : "?";
                                $(message.idLink).attr("href", $(message.idLink).attr("href") + symboleAdd + "tutorielId=" + _this.tutorialId + "&startStep=" + (message.step + 1));
                                break;
                        }
                    }
                }
            }
        });

        this.intro.onafterchange(function(targetElement) {
            var intro=this;

            // Bug introjs with modal bootstrat, we move introjs directly into the modal to correct it (bug with fix position)
            // by default introjs element on body
            $('.introjs-overlay, .introjs-helperLayer, .introjs-tooltipReferenceLayer').appendTo("body");
            if(intro._options.steps[intro._currentStep ] !== undefined && intro._options.steps[intro._currentStep ].element !== undefined) {
                waitForElementToDisplay(intro._options.steps[intro._currentStep].element, 100, function () {
                    if ($("div.modal.introjs-fixParent").length == 1) {
                        $('.introjs-overlay, .introjs-helperLayer, .introjs-tooltipReferenceLayer').appendTo("div.modal.introjs-fixParent");
                        $('.introjs-overlay').css("position", "absolute");
                        $('.introjs-overlay').css("height", $(document).height() + "px");
                    }
                    $('.introjs-helperLayer, .introjs-tooltipReferenceLayer').removeClass("introjs-fixedTooltip");
                });
             }
        });

        // wait for the first element
        if(this.listMessage[startStep-1] != undefined && this.listMessage[startStep-1].element != undefined) {
            waitForElementToDisplay(this.listMessage[startStep - 1].element, 100, function() {
                _this.intro.start();
            });
        } else {
            this.intro.start();
        }
    }

}




function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};


function waitForElementToDisplay(selector, time, callback) {
    if($(selector).is(":visible")) {
        callback();
        return;
    }
    else {
        setTimeout(function() {
            waitForElementToDisplay(selector, time, callback);
        }, time);
    }
}

