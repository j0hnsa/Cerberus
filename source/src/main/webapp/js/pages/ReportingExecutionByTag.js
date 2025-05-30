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
/* global handleErrorAjaxAfterTimeout */

$.when($.getScript("js/global/global.js")).then(function () {
    $(document).ready(function () {
        initPage();

        bindToggleCollapse();

        var urlTag = GetURLParameter('Tag');

        $("#splitFilter input").click(function () {
            //save the filter preferences in the session storage
            var serial = $("#splitFilter input").serialize();
            var obj = convertSerialToJSONObject(serial);
            sessionStorage.setItem("splitFilter", JSON.stringify(obj));
            //split when check or uncheck filter
            if (urlTag !== null && urlTag !== "" && urlTag !== undefined) {
                filterCountryBrowserReport(urlTag);
            }
        });

        splitFilterPreferences();

        $("#reportByEnvCountryBrowser .nav li").on("click", function (event) {
            stopPropagation(event);
            $(this).parent().find(".active").removeClass("active");
            $(this).addClass("active");
            if ($(this).prop("id") === "tab") {
                $("#progressEnvCountryBrowser").hide();
                $("#summaryTableDiv").show();
            } else if ($(this).prop("id") === "graph") {
                $("#progressEnvCountryBrowser").show();
                $("#summaryTableDiv").hide();
            }
        });

        loadTagFilters(urlTag);
        if (urlTag !== null) {
            loadAllReports(urlTag);
        }
        $('body').tooltip({
            selector: '[data-toggle="tooltip"]'
        });

        //open Run navbar Menu
        openNavbarMenu("navMenuExecutionReporting");

        $('[data-toggle="popover"]').popover({
            'placement': 'auto',
            'container': 'body'}
        );
    });
});

/*
 * Loading functions
 */

function initPage() {
    var doc = new Doc();

    displayHeaderLabel(doc);
    displayPageLabel(doc);
    displayFooter(doc);
    loadCountryFilter();
    $("#exportList").change(controlExportRadioButtons);
    loadSummaryTableOptions();
}
function loadSummaryTableOptions() {
    if (document.queryCommandSupported('Copy')) {
        $("#copyButton").html("Copy to Clipboard");
    } else {
        $("#copyButton").html("Select table");
    }

}

function loadCountryFilter() {
    $.ajax({url: "FindInvariantByID",
        data: {idName: "COUNTRY"},
        async: false,
        dataType: 'json',
        success: function (data) {
            var countryFilter = $("#countryFilter");
            var len = data.length;

            for (var i = 0; i < len; i++) {
                var filter = JSON.parse(sessionStorage.getItem("countryFilter"));
                var cb;

                //Load the filters depenbding on the preferences retrieved from session storage
                if (filter !== null && !filter.hasOwnProperty(data[i].value)) {
                    cb = '<label class="checkbox-inline">\n\
                        <input type="checkbox" name="' + data[i].value + '"/>\n\
                        ' + data[i].value + '</label>';
                } else {
                    cb = '<label class="checkbox-inline">\n\
                        <input type="checkbox" name="' + data[i].value + '" checked/>\n\
                        ' + data[i].value + '</label>';
                }
                countryFilter.append(cb);
            }
            $("#countryFilter input").on("click", function () {
                //save the filter preferences in the session storage
                var serial = $("#countryFilter input").serialize();
                var obj = convertSerialToJSONObject(serial);
                sessionStorage.setItem("countryFilter", JSON.stringify(obj));
            });
        }
    });
    $("#countrySelectAll").on("click", function () {
        $("#countryFilter input").prop('checked', true);
    });
    $("#countryUnselectAll").on("click", function () {
        $("#countryFilter input").prop('checked', false);
    });
    $("#statusSelectAll").on("click", function () {
        $("#statusFilter input").prop('checked', true);
    });
    $("#statusUnselectAll").on("click", function () {
        $("#statusFilter input").prop('checked', false);
    });
}

function splitFilterPreferences() {
    var filter = JSON.parse(sessionStorage.getItem("splitFilter"));

    if (filter !== null) {
        $("#splitFilter input").each(function () {
            if (filter.hasOwnProperty($(this).prop("name"))) {
                $(this).prop("checked", true);
            } else {
                $(this).prop("checked", false);
            }
        });
    }
}

function displaySummaryTableLabel(doc) {
    $("#summaryTableTitle").html(doc.getDocOnline("page_reportbytag", "summary_table"));
    //summary table header    
    $("#summaryTableHeaderApplication").html(doc.getDocOnline("application", "Application"));
    $("#summaryTableHeaderCountry").html(doc.getDocOnline("invariant", "COUNTRY"));
    $("#summaryTableHeaderEnvironment").html(doc.getDocOnline("invariant", "ENVIRONMENT"));

    $("#selectTableButtonText").html(doc.getDocOnline("page_reportbytag", "btn_select_table"));
}

function displayExportDataLabel(doc) {
    //$("#exportDataLabel").html(doc.getDocOnline("page_global", "export_data")); //export panel //TODO:FN remove comments after development
    //$("#exportDataButton").html(doc.getDocOnline("page_global", "btn_export")); //button export //TODO:FN remove comments after development
}
function displayPageLabel(doc) {
    $("#pageTitle").html(doc.getDocLabel("page_reportbytag", "title"));
    $("#title").html(doc.getDocOnline("page_reportbytag", "title"));
    $("#loadbutton").html(doc.getDocLabel("page_reportbytag", "button_load"));
    $("#reloadbutton").html(doc.getDocLabel("page_reportbytag", "button_reload"));
    $("#filters").html(doc.getDocOnline("page_reportbytag", "filters"));
    $("#reportStatus").html(doc.getDocOnline("page_reportbytag", "report_status"));
    $("#reportFunction").html(doc.getDocOnline("page_reportbytag", "report_function"));
    displaySummaryTableLabel(doc);
    displayExportDataLabel(doc);
    $("#envCountryBrowser").html(doc.getDocOnline("page_reportbytag", "report_envcountrybrowser"));
    $("#List").html(doc.getDocOnline("page_reportbytag", "report_list"));
    $("#statusLabel").html(doc.getDocLabel("testcase", "Status") + " :");
}


function loadTagFilters(urlTag) {

    $("#selectTag").select2(getComboConfigTag());

    if (urlTag !== null) {
        var $option = $('<option></option>').text(urlTag).val(urlTag);
        $("#selectTag").append($option).trigger('change'); // append the option and update Select2
    }
}


function loadAllReports(urlTag) {

    if (urlTag === undefined) {
        urlTag = $('#selectTag').val();
        InsertURLInHistory('ReportingExecutionByTag.jsp?Tag=' + encodeURIComponent(urlTag) + '');
    }

    if (urlTag !== "") {
        loadReportingData(urlTag);
    }
}

function loadReportingData(selectTag) {
    //var selectTag = $("#selectTag option:selected").text();
    showLoader($("#ReportByStatus"));
    showLoader($("#functionChart"));
    var statusFilter = $("#statusFilter input");
    var countryFilter = $("#countryFilter input");
    var params = $("#splitFilter input");
    $("#startExe").val("");
    $("#endExe").val("");
    $("#endLastExe").val("");
    //Retrieve data for charts and draw them
    var jqxhr = $.get("ReadTestCaseExecutionByTag?Tag=" + selectTag + "&" + statusFilter.serialize() + "&" + countryFilter.serialize() + "&" + params.serialize(), null, "json");
    $.when(jqxhr).then(function (data) {
        $("#startExe").val(data.tagObject.DateCreated);
        $("#endExe").val(data.tagObject.DateEndQueue);
        $("#durExe").val(data.tagDuration);
        if (data.tagDuration >= 0) {
            $("#panelDuration").removeClass("hidden");
            $("#durExe").removeClass("hidden");
        } else {
            $("#panelDuration").addClass("hidden");
            $("#durExe").addClass("hidden");
        }
        loadByStatusAndByfunctionReports(data.functionChart, selectTag);
        loadEnvCountryBrowserReport(data.statsChart);
        loadReportList(data.table, selectTag);
    });

}

function  filterCountryBrowserReport(selectTag, splitFilterSettings) {
    //var selectTag = $("#selectTag option:selected").text();
    var statusFilter = $("#statusFilter input");
    var countryFilter = $("#countryFilter input");
    var params = $("#splitFilter input");
    var requestToServlet = "ReadTestCaseExecutionByTag?Tag=" + selectTag + "&" + statusFilter.serialize() + "&" + countryFilter.serialize() + "&" + params.serialize() + "&" + "outputReport=statsChart";
    var jqxhr = $.get(requestToServlet, null, "json");

    $.when(jqxhr).then(function (data) {
        loadEnvCountryBrowserReport(data.statsChart);
    });

}

function loadByStatusAndByfunctionReports(data, selectTag) {

    //clear the old report content before redrawing it
    $("#ReportByStatusTable").empty();
    $("#statusChart").empty();
    $("#ReportByfunctionChart").empty();
    loadReportByStatusTable(data, selectTag);
    loadReportByFunctionChart(data, selectTag);
    $("#endLastExe").val(data.globalEnd);

}





function generateBarTooltip(data, statusOrder) {
    var htmlRes = "";
    var len = statusOrder.length;

    for (var index = 0; index < len; index++) {
        var status = statusOrder[index];

        if (data.hasOwnProperty(status)) {
            htmlRes += "<div>\n\
                        <span class='color-box status" + status + "'></span>\n\
                        <strong> " + status + " : </strong>" + data[status] + "</div>";
        }
    }
    htmlRes += '</div>';
    return htmlRes;
}

function buildBar(obj) {
    var buildBar;
    var statusOrder = ["OK", "KO", "FA", "NA", "NE", "PE", "QU", "CA"];
    var len = statusOrder.length;
    //Build the title to show at the top of the bar by checking the value of the checkbox
    var params = $("#splitFilter input");
    var key = "";
    if (params[0].checked)
        key += obj.environment + " ";
    if (params[1].checked)
        key += obj.country + " ";
    if (params[2].checked)
        key += obj.browser + " ";
    if (params[3].checked)
        key += obj.application;
    if (key === "")//if no spliter if selected
        key = "Total";

    var tooltip = generateBarTooltip(obj, statusOrder);
    buildBar = '<div>' + key + '<div class="pull-right" style="display: inline;">Total executions : ' + obj.total + '</div>\n\
                                                        </div><div class="progress" data-toggle="tooltip" data-html="true" title="' + tooltip + '">';

    for (var i = 0; i < len; i++) {
        var status = statusOrder[i];

        if (obj[status] !== 0) {
            var percent = (obj[status] / obj.total) * 100;
            var roundPercent = Math.round(percent * 10) / 10;

            buildBar += '<div class="progress-bar status' + status + '" \n\
                                    role="progressbar" \n\
                                    style="width:' + percent + '%;">' + roundPercent + '%</div>';
        }
    }
    buildBar += '</div>';
    $("#progressEnvCountryBrowser").append(buildBar);
}

function loadEnvCountryBrowserReport(data) {
    //adds a loader to a table 
    showLoader($("#reportEnvCountryBrowser"));
    $("#progressEnvCountryBrowser").empty();

    var len = data.contentTable.split.length;
    createSummaryTable(data.contentTable);
    for (var index = 0; index < len; index++) {
        //draw a progress bar for each combo retrieved
        buildBar(data.contentTable.split[index]);
        hideLoader($("#reportEnvCountryBrowser"));
    }

}

function loadReportList(data2, selectTag) {
    showLoader($("#listReport"));

    if (selectTag !== "") {
        if ($("#listTable_wrapper").hasClass("initialized")) {
            $("#tableArea").empty();
            $("#tableArea").html('<table id="listTable" class="table display" name="listTable">\n\
                                            </table><div class="marginBottom20"></div>');
        }

        var config = new TableConfigurationsClientSide("listTable", data2.tableContent, aoColumnsFunc(data2.tableColumns), [2, 'asc']);
        customConfig(config);

        var table = createDataTableWithPermissions(config, undefined, "#tableArea", undefined, undefined, undefined, createShortDescRow);
        $('#listTable_wrapper').not('.initialized').addClass('initialized');
        hideLoader($("#listReport"));
        renderOptionsForExeList(selectTag);
    }
}

/*
 * Status panels
 */

function appendPanelStatus(status, total, selectTag) {
    var rowClass = getRowClass(status);
    if (rowClass.panel === "panelQU") {
        // When we display the QU status, we add a link to all executions in the queue on the queue page.
        $("#ReportByStatusTable").append(
                $("<a href='./TestCaseExecutionQueueList.jsp?search=" + selectTag + "'></a>").append(
                $("<div class='panel " + rowClass.panel + "'></div>").append(
                $('<div class="panel-heading"></div>').append(
                $('<div class="row"></div>').append(
                $('<div class="col-xs-6 status"></div>').text(status).prepend(
                $('<span class="' + rowClass.glyph + '" style="margin-right: 5px;"></span>'))).append(
                $('<div class="col-xs-6 text-right"></div>').append(
                $('<div class="total"></div>').text(total[status].value)))).append(
                $('<div class="row"></div>').append(
                $('<div class="percentage pull-right"></div>').text('Percentage : ' + Math.round(((total[status].value / total.test) * 100) * 100) / 100 + '%'))
                ))));
    } else {
        $("#ReportByStatusTable").append(
                $("<div class='panel " + rowClass.panel + "'></div>").append(
                $('<div class="panel-heading"></div>').append(
                $('<div class="row"></div>').append(
                $('<div class="col-xs-6 status"></div>').text(status).prepend(
                $('<span class="' + rowClass.glyph + '" style="margin-right: 5px;"></span>'))).append(
                $('<div class="col-xs-6 text-right"></div>').append(
                $('<div class="total"></div>').text(total[status].value)))).append(
                $('<div class="row"></div>').append(
                $('<div class="percentage pull-right"></div>').text('Percentage : ' + Math.round(((total[status].value / total.test) * 100) * 100) / 100 + '%'))
                )));
    }
}

function loadReportByStatusTable(data, selectTag) {
    var total = {};
    var len = data.axis.length;

    //calculate totaltest nb
    total["test"] = 0;
    for (var index = 0; index < len; index++) {
        // increase the total execution
        for (var key in data.axis[index]) {
            if (key !== "name") {
                if (total.hasOwnProperty(key)) {
                    total[key].value += data.axis[index][key].value;
                } else {
                    total[key] = {"value": data.axis[index][key].value,
                        "color": data.axis[index][key].color};
                }
                total.test += data.axis[index][key].value;
            }
        }
    }

    // create a panel for each control status
    for (var label in total) {
        if (label !== "test") {
            appendPanelStatus(label, total, selectTag);
        }
    }
// add a panel for the total
    $("#ReportByStatusTable").append(
            $("<div class='panel panel-primary'></div>").append(
            $('<div class="panel-heading"></div>').append(
            $('<div class="row"></div>').append(
            $('<div class="col-xs-6 status"></div>').text("Total").prepend(
            $('<span class="" style="margin-right: 5px;"></span>'))).append(
            $('<div class="col-xs-6 text-right"></div>').append(
            $('<div class="total"></div>').text(total.test))
            ))));
    //format data to be used by the chart

    var dataset = [];
    for (var label in total) {
        if (label !== "test") {
            dataset.push(total[label]);
        }
    }
    loadReportByStatusChart(dataset);
}

/*
 * Charts functions
 */

function loadReportByStatusChart(data) {

    var margin = {top: 20, right: 25, bottom: 20, left: 50};

    var offsetW = document.getElementById('statusChart').offsetWidth;
    if (offsetW === 0) {
        offsetW = 300;
    }
    var offsetH = document.getElementById('ReportByStatusTable').offsetHeight;
    if (offsetH === 0) {
        offsetH = 300;
    }

    var width = offsetW - margin.left - margin.right;
    var height = offsetH - margin.top - margin.bottom;
    var radius = Math.min(width, height) / 2;

    var svg = d3.select('#statusChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')')

    var arc = d3.svg.arc()
            .outerRadius(radius);

    var pie = d3.layout.pie()
            .value(function (d) {
                return d.value;
            })
            .sort(null);

    var path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function (d, i) {
                return d.data.color;
            });
    hideLoader($("#ReportByStatus"));
}

function convertData(dataset) {
    var data = [];

    for (var i in dataset)
        data.push(dataset[i]);
    return data;
}

function loadReportByFunctionChart(dataset) {
    var data = convertData(dataset.axis);

    var margin = {top: 20, right: 20, bottom: 200, left: 150},
            width = 1200 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
            .rangeRound([height, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

    var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                var res = "<strong>Function :</strong> <span style='color:red'>" + d.name + "</span>";
                var len = d.chartData.length;

                for (var index = 0; index < len; index++) {
                    res = res + "<div><div class='color-box' style='background-color:" + d.chartData[index].color + " ;'>\n\
                    </div>" + d.chartData[index].name + " : " + d[d.chartData[index].name].value + "</div>";
                }
                return res;
            });

    var svg = d3.select("#ReportByfunctionChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);


    data.forEach(function (d) {
        var y0 = 0;
        d.chartData = [];
        for (var status in d) {
            if (status !== "name" && status !== "chartData") {
                d.chartData.push({name: status, y0: y0, y1: y0 += +d[status].value, color: d[status].color});
            }
        }
        d.totalTests = d.chartData[d.chartData.length - 1].y1;
    });

    x.domain(data.map(function (d) {
        return d.name;
    }));
    y.domain([0, d3.max(data, function (d) {
            return d.totalTests;
        })]);

    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .call(wrap, 200)
            .style({"text-anchor": "end"})
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-75)");

    svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("TestCase Number");

    var name = svg.selectAll(".name")
            .data(data)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function (d) {
                return "translate(" + x(d.name) + ",0)";
            });

    svg.selectAll(".g")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

    name.selectAll("rect")
            .data(function (d) {
                return d.chartData;
            })
            .enter().append("rect")
            .attr("width", x.rangeBand())
            .attr("y", function (d) {
                return y(d.y1);
            })
            .attr("height", function (d) {
                return y(d.y0) - y(d.y1);
            })
            .style("fill", function (d) {
                return d.color;
            });
    hideLoader($("#functionChart"));
}

/*** EXPORT OPTIONS***/

function exportReport() {
    //open file chooser and then export
    var selectTag = $("#selectTag option:selected").text();
    var statusFilter = $("#statusFilter input");
    var countryFilter = $("#countryFilter input");
    var exportDataFilter = $("#exportData input");

    var jqxhr = $.getJSON("ReadTestCaseExecution", "Tag=" + selectTag + "&" + statusFilter.serialize() +
            "&" + countryFilter.serialize() + "&" + exportDataFilter.serialize());
    $.when(jqxhr).then(function (data) {
        alert(data);
    });
}

function controlExportRadioButtons() {
    //control radiobuttons
    var isChecked = $(this).prop("checked");
    if (isChecked) {
        $("input[name='exportOption']").prop("disabled", false);
    } else {
        $("input[name='exportOption']").prop("disabled", true);
    }
}

/*** SUMMARY TABLE options ****/

/**
 * Create a row for the summaryTable
 * @param {JSONObject} row containing the data of the row
 * @param {boolean} isTotalRow true is the row to display is total line.
 * @returns {jQuery} the jquery object row
 */
function createRow(row, isTotalRow) {

    var $tr = $('<tr>');
    var params = $("#splitFilter input");

    if (!isTotalRow) {
        if (params[0].checked) {
            if (row.environment === "Total")//TODO: make this change in the back-end
                row.environment = "";//The part where Total is written is handle in a more generic way
            $tr.append($('<td>').text(row.environment).css("text-align", "center"));
        }
        if (params[1].checked)
            $tr.append($('<td>').text(row.country).css("text-align", "center"));
        if (params[2].checked)
            $tr.append($('<td>').text(row.browser).css("text-align", "center"));
        if (params[3].checked)
            $tr.append($('<td>').text(row.application).css("text-align", "center"));
    } else {
        var blankSpaceToAdd = 0;
        for (var i in params) {
            if (params[i].checked)
                blankSpaceToAdd++;
        }
        if (blankSpaceToAdd !== 0) {
            $tr.append($('<td>').text("Total").css("text-align", "center"));
            blankSpaceToAdd--;//remove a blank space for the total
            for (var i = 0; i < blankSpaceToAdd; i++) {
                $tr.append($('<td>').text("").css("text-align", "center"));
            }
        }
    }
    $tr.append(
            $('<td>').text(row.OK).css("text-align", "right"),
            $('<td>').text(row.KO).css("text-align", "right"),
            $('<td>').text(row.FA).css("text-align", "right"),
            $('<td>').text(row.NA).css("text-align", "right"),
            $('<td>').text(row.NE).css("text-align", "right"),
            $('<td>').text(row.PE).css("text-align", "right"),
            $('<td>').text(row.QU).css("text-align", "right"),
            $('<td>').text(row.CA).css("text-align", "right"),
            $('<td>').text(row.notOKTotal).css("text-align", "right"),
            $('<td>').text(row.total).css("text-align", "right"),
            $('<td>').text(row.percOK + "%").css("text-align", "right"),
            $('<td>').text(row.percKO + "%").css("text-align", "right"),
            $('<td>').text(row.percFA + "%").css("text-align", "right"),
            $('<td>').text(row.percNA + "%").css("text-align", "right"),
            $('<td>').text(row.percNE + "%").css("text-align", "right"),
            $('<td>').text(row.percPE + "%").css("text-align", "right"),
            $('<td>').text(row.percQU + "%").css("text-align", "right"),
            $('<td>').text(row.percCA + "%").css("text-align", "right"),
            $('<td>').text(row.percNotOKTotal + "%").css("text-align", "right")
            );
    return $tr;
}

/**
 * Create a row for the summaryTableHeader
 * @returns {jQuery} the jquery object row
 */
function createHeaderRow() {
    var $tr = $('<tr>');

    var params = $("#splitFilter input");
    if (params[0].checked)
        $tr.append($('<td>').text("Environment").css("text-align", "center"));
    if (params[1].checked)
        $tr.append($('<td>').text("Country").css("text-align", "center"));
    if (params[2].checked)
        $tr.append($('<td>').text("Browser").css("text-align", "center"));
    if (params[3].checked)
        $tr.append($('<td>').text("Application").css("text-align", "center"));

    $tr.append(
            $('<td>').text("OK").css("text-align", "center"),
            $('<td>').text("KO").css("text-align", "center"),
            $('<td>').text("FA").css("text-align", "center"),
            $('<td>').text("NA").css("text-align", "center"),
            $('<td>').text("NE").css("text-align", "center"),
            $('<td>').text("PE").css("text-align", "center"),
            $('<td>').text("QU").css("text-align", "center"),
            $('<td>').text("CA").css("text-align", "center"),
            $('<td>').text("NOT OK").css("text-align", "center"),
            $('<td>').text("TOTAL").css("text-align", "center"),
            $('<td>').text("% OK").css("text-align", "center"),
            $('<td>').text("% KO").css("text-align", "center"),
            $('<td>').text("% FA").css("text-align", "center"),
            $('<td>').text("% NA").css("text-align", "center"),
            $('<td>').text("% NE").css("text-align", "center"),
            $('<td>').text("% PE").css("text-align", "center"),
            $('<td>').text("% QU").css("text-align", "center"),
            $('<td>').text("% CA").css("text-align", "center"), /*.class("width80")*/
            $('<td>').text("% NOT OK").css("text-align", "center")
            );
    return $tr;
}
/**
 * Creates a summary table from data retrieved from server.
 * @param {type} data
 * @returns {undefined}
 */
function createSummaryTable(data) {
    //cleans the data that was already added
    $("#summaryTableHeader tr").remove();
    $("#summaryTableBody tr").remove();
    $("#summaryTableHeader").append(createHeaderRow(data.total));
    //TODO:FN verifies if table is empty?
    $.when($.each(data.split, function (idx, obj) {
        //creates a new row 
        //numbers are aligned to right
        var $tr = createRow(obj, false);
        if (obj.percOK === 100) {
            $($tr).addClass("summary100");
        }
        $("#summaryTableBody").append($tr);
    })).then(function () {
        var $total = createRow(data.total, true);
        $total.addClass("summaryTotal");
        $("#summaryTableBody").append($total);
        //alternate colors
        $("#summaryTableBody tr:odd").css("background-color", "rgba(225,231,243,0.2)");
        //if the row is the summary total, then it will have the background color blue
        $("#summaryTableBody tr.summaryTotal").css("background-color", "rgba(66,139,202,0.2)").css("font-weight", "900");
        //if the row has 100% ok, then it will have the background color green
        $("#summaryTableBody tr.summary100").css("background-color", "rgba(92,184,0,0.2)");

    });
}
function selectTableToCopy() {

    var el = document.getElementById('summaryTable');

    var body = document.body, range, sel;
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        sel = window.getSelection();
        sel.removeAllRanges();
        try {
            range.selectNodeContents(el);
            sel.addRange(range);
        } catch (e) {
            range.selectNode(el);
            sel.addRange(range);
        }

    } else if (body.createTextRange) {
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}

function createShortDescRow(row, data, index) {
    var tableAPI = $("#listTable").DataTable();

    var createdRow = tableAPI.row(row);

    createdRow.child([data.shortDesc, "labels"]);
    $(row).children('.center').attr('rowspan', '3');
    $(row).children('.priority').attr('rowspan', '3');
    $(row).children('.bugid').attr('rowspan', '3');
    $(createdRow.child()).children('td').attr('colspan', '3').attr('class', 'shortDesc');
    var labelValue = '';
    $.each(data.labels, function (i, e) {
        labelValue += '<div style="float:left"><span class="label label-primary" style="background-color:' + e.color + '" data-toggle="tooltip" title="' + e.description + '">' + e.name + '</span></div> ';
    });
    $($(createdRow.child())[1]).children('td').html(labelValue);
    createdRow.child.show();
}

function generateTooltip(data) {
    var htmlRes;

    htmlRes = '<div><span class=\'bold\'>Execution ID :</span> ' + data.ID + '</div>' +
            '<div><span class=\'bold\'>Country : </span>' + data.Country + '</div>' +
            '<div><span class=\'bold\'>Environment : </span>' + data.Environment + '</div>' +
            '<div><span class=\'bold\'>Browser : </span>' + data.Browser + '</div>' +
            '<div><span class=\'bold\'>Start : </span>' + new Date(data.Start) + '</div>' +
            '<div><span class=\'bold\'>End : </span>' + new Date(data.End) + '</div>' +
            '<div>' + data.ControlMessage + '</div>';

    return htmlRes;
}

function openModalTestCase_FromRepTag(element, test, testcase, mode) {
    openModalTestCase(test, testcase, mode);
    $('#editTestCaseModal').on("hidden.bs.modal", function (e) {
        $('#editTestCaseModal').unbind("hidden.bs.modal");
        console.info("DONE - " + element);
        var testcaseobj = $('#editTestCaseModal').data("testcase");
        if ((!(testcaseobj === undefined)) && ($('#editTestCaseModal').data("Saved"))) {
            // when modal is closed, we check that testcase object exist and has been saved in order to update the comment and bugid on reportbytag screen.
            var newComment = $('#editTestCaseModal').data("testcase").comment;
            var newBugId = $('#editTestCaseModal').data("testcase").bugId;
            $(element).parent().parent().find('td.comment').text(newComment);
            $(element).parent().parent().find('td.bugid').text(newBugId);
        }
    });
}

function selectAllQueue(status) {
    if ($('#selectAllQueue' + status).prop("checked")) {
        $("[data-line='select" + status + "']").prop("checked", true);
    } else {
        $("[data-line='select" + status + "']").prop("checked", false);
    }
    refreshNbChecked();
}

function refreshNbChecked() {
    // Count total nb of result in order to display it and activate or not the button.
    var nbchecked = $("[data-select='id']:checked").size();
    console.info(nbchecked);
    if (nbchecked > 0) {
        $('#submitExe').prop("disabled", false);
        $('#submitExe').html("<span class='glyphicon glyphicon-play'></span> Submit Again (" + nbchecked + ")");
    } else {
        $('#submitExe').prop("disabled", true);
        $('#submitExe').html("<span class='glyphicon glyphicon-play'></span> Submit Again");
    }
}

function renderOptionsForExeList(selectTag) {
    if ($("#blankSpace").length === 0) {
        var doc = new Doc();
        var contentToAdd = "<div class='marginBottom10'>";
        contentToAdd += "<label>Select all/none :</label>";
        contentToAdd += "<label class='checkbox-inline'><input id='selectAllQueueFA' type='checkbox'></input>FA</label>";
        contentToAdd += "<label class='checkbox-inline'><input id='selectAllQueueKO' type='checkbox'></input>KO</label>";
        contentToAdd += "<label class='checkbox-inline'><input id='selectAllQueueQUERROR' type='checkbox'></input>QU (ERROR)</label>";
        contentToAdd += "<button id='submitExe' type='button' disabled='disabled' title='Submit again the selected executions.' class='btn btn-default'><span class='glyphicon glyphicon-play'></span> Submit Again</button>";
        contentToAdd += "<a href='TestCaseExecutionQueueList.jsp?search=" + selectTag + "'><button id='openqueue' type='button' class='btn btn-default'><span class='glyphicon glyphicon-list'></span> Open Queue</button></a>";
        contentToAdd += "</div>";

        $("#listTable_wrapper div#listTable_filter").before(contentToAdd);
        $('#selectAllQueueFA').click(function () {
            selectAllQueue("FA");
        });
        $('#selectAllQueueKO').click(function () {
            selectAllQueue("KO");
        });
        $('#selectAllQueueQUERROR').click(function () {
            selectAllQueue("QUERROR");
        });
        $('#submitExe').click(massAction_copyQueue);
    }
}

function massAction_copyQueue() {

    clearResponseMessageMainPage();

    var doc = new Doc();
    var formList = $('#massActionForm');
    var paramSerialized = formList.serialize();

    if (paramSerialized.indexOf("id") === -1) {
        var localMessage = new Message("danger", doc.getDocLabel("page_global", "message_massActionError"));
        showMessage(localMessage, null);
    } else {

        var jqxhr = $.post("CreateTestCaseExecutionQueue", paramSerialized + "&actionState=toQUEUED&actionSave=save", "json");
        $.when(jqxhr).then(function (data) {
            // unblock when remote call returns 
            if ((getAlertType(data.messageType) === "success") || (getAlertType(data.messageType) === "warning")) {
                showMessage(data);
            } else {
                showMessage(data);
            }
        }).fail(handleErrorAjaxAfterTimeout);
    }

}


function aoColumnsFunc(Columns) {
    var doc = new Doc();
    var colLen = Columns.length;
    var nbColumn = colLen + 5;
    var testCaseInfoWidth = (1 / 6) * 30;
    var testExecWidth = (1 / nbColumn) * 70;
    var tag = $('#selectTag').val();

    var aoColumns = [
        {
            "data": "test",
            "sName": "tec.test",
            "sWidth": testCaseInfoWidth + "%",
            "title": doc.getDocOnline("test", "Test"),
            "sClass": "bold"
        },
        {
            "data": "testCase",
            "sName": "tec.testCase",
            "sWidth": testCaseInfoWidth + "%",
            "title": doc.getDocOnline("testcase", "TestCase"),
            "mRender": function (data, type, obj, meta) {
                var result = "<a href='./TestCaseScript.jsp?test=" + encodeURIComponent(obj.test) + "&testcase=" + encodeURIComponent(obj.testCase) + "'>" + obj.testCase + "</a>";
                var editEntry = '<button id="editEntry" onclick="openModalTestCase_FromRepTag(this,\'' + escapeHtml(obj["test"]) + '\',\'' + escapeHtml(obj["testCase"]) + '\',\'EDIT\');"\n\
                                class="editEntry btn btn-default btn-xs margin-right5" \n\
                                name="editEntry" data-toggle="tooltip"  title="' + doc.getDocLabel("page_testcaselist", "btn_edit") + '" type="button">\n\
                                <span class="glyphicon glyphicon-pencil"></span></button>';
                if (obj.testExist) {
                    return editEntry + result;
//                    return result;
                } else {
                    return obj.testCase;
                }
            }
        },
        {
            "data": "application",
            "sName": "app.application",
            "sWidth": testCaseInfoWidth + "%",
            "title": doc.getDocOnline("application", "Application")
        }
    ];
    for (var i = 0; i < colLen; i++) {
        var title = Columns[i].environment + " " + Columns[i].country + " " + Columns[i].browser;

        var col = {
            "title": title,
            "bSortable": true,
            "bSearchable": true,
            "sWidth": testExecWidth + "%",
            "data": function (row, type, val, meta) {
                var dataTitle = meta.settings.aoColumns[meta.col].sTitle;
                if (row.hasOwnProperty("execTab") && row["execTab"].hasOwnProperty(dataTitle)) {
                    return row["execTab"][dataTitle];
                } else {
                    return "";
                }
            },
            "sClass": "center",
            "mRender": function (data) {
                if (data !== "") {
                    // Getting selected Tag;
                    var executionLink = generateExecutionLink(data.ControlStatus, data.ID, tag);
                    var glyphClass = getRowClass(data.ControlStatus);
                    var tooltip = generateTooltip(data);
                    var cell = "";
                    cell += '<table class="table"><tr>';
                    var state = data.ControlStatus;
                    if (!isEmpty(data.QueueState)) {
                        state += data.QueueState;
                    }
                    if ((data.QueueID !== undefined) && (data.QueueID !== "0")) {
                        cell += '<td><input id="selectLine" name="id" value=' + data.QueueID + ' onclick="refreshNbChecked()" data-select="id" data-line="select' + state + '" data-id="' + data.QueueID + '" title="Select for Action" type="checkbox"></input></td>';
                    }
                    if (data.ControlStatus === "QU") {
                        cell += '<td><div class="progress-bar progress-bar-queue status' + data.ControlStatus + '" ';
                    } else {
                        cell += '<td><div class="progress-bar status' + data.ControlStatus + '" ';
                    }
                    cell += 'role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;cursor: pointer; height: 40px;"';
                    cell += 'data-toggle="tooltip" data-html="true" title="' + tooltip + '"';
                    if (data.ControlStatus === "QU") {
                        cell += ' onclick="openModalTestCaseExecutionQueue(' + data.QueueID + ', \'EDIT\');">\n\' ';
                    } else {
                        cell += ' onclick="window.open(\'' + executionLink + '\')">';
                    }
                    cell += '<span class="' + glyphClass.glyph + ' marginRight5"></span>';
                    cell += '<span>' + data.ControlStatus + '<span>';
                    if (data.QueueState !== undefined) {
                        cell += '<br><span style="font-size: xx-small">' + data.QueueState + '<span>';
                    }
                    cell += '</div>';
                    cell += "</td></tr></table>";
                    return cell;
                } else {
                    return data;
                }
            }
        };
        aoColumns.push(col);
    }
    var col =
            {
                "data": "priority",
                "sName": "tec.priority",
                "sClass": "priority",
                "sWidth": testCaseInfoWidth + "%",
                "title": doc.getDocOnline("invariant", "PRIORITY")
            };
    aoColumns.push(col);
    var col =
            {
                "data": "comment",
                "sName": "tec.comment",
                "sClass": "comment",
                "sWidth": testCaseInfoWidth + "%",
                "title": doc.getDocOnline("testcase", "Comment")
            };
    aoColumns.push(col);
    var col =
            {
                "data": "bugId.bugId",
                "mRender": function (data, type, obj) {
                    if (obj.bugId.bugTrackerUrl !== "") {
                        var link = '<a target="_blank" href="' + obj.bugId.bugTrackerUrl + '">' + obj.bugId.bugId + "</a>";
                        return link;
                    } else {
                        return obj.bugId.bugId;
                    }
                },
                "sName": "tec.bugId",
                "sClass": "bugid",
                "sWidth": testCaseInfoWidth + "%",
                "title": doc.getDocOnline("testcase", "BugID")
            };
    aoColumns.push(col);

    return aoColumns;
}

function customConfig(config) {
    var doc = new Doc();
    var customColvisConfig = {"buttonText": doc.getDocLabel("dataTable", "colVis"),
        "exclude": [0, 1, 2],
        "stateChange": function (iColumn, bVisible) {
            $('.shortDesc').each(function () {
                $(this).attr('colspan', '3');
            });
            $('.label').each(function () {
                $(this).attr('colspan', '3');
            });
        }
    };

    config.bPaginate = true;
    config.lengthMenu = [10, 25, 50, 100, 500, 1000, 1500, 2000];
    config.lang.colVis = customColvisConfig;
    config.orderClasses = false;
    config.bDeferRender = true;
    config.displayLength = 500;

}

function getRowClass(status) {
    var rowClass = [];

    rowClass["panel"] = "panel" + status;
    if (status === "OK") {
        rowClass["glyph"] = "glyphicon glyphicon-ok";
    } else if (status === "KO") {
        rowClass["glyph"] = "glyphicon glyphicon-remove";
    } else if (status === "FA") {
        rowClass["glyph"] = "fa fa-bug";
    } else if (status === "CA") {
        rowClass["glyph"] = "fa fa-life-ring";
    } else if (status === "PE") {
        rowClass["glyph"] = "fa fa-hourglass-half";
    } else if (status === "NE") {
        rowClass["glyph"] = "fa fa-clock-o";
    } else if (status === "NA") {
        rowClass["glyph"] = "fa fa-question";
    } else {
        rowClass["glyph"] = "";
    }
    return rowClass;
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
