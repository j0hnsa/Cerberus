/**
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
package org.cerberus.servlet.zzpublic;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Timestamp;
import java.text.ParseException;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.cerberus.crud.entity.TestCaseExecution;
import org.cerberus.crud.service.ILogEventService;
import org.cerberus.crud.service.IParameterService;
import org.cerberus.crud.service.ITestCaseExecutionService;
import org.cerberus.crud.service.impl.TestCaseExecutionService;
import org.cerberus.exception.CerberusException;
import org.cerberus.servlet.crud.usermanagement.ReadLogEvent;
import org.cerberus.util.answer.AnswerUtil;
import org.cerberus.util.servlet.ServletUtil;
import org.json.JSONException;
import org.json.JSONObject;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

/**
 * @author bcivel
 */
@WebServlet(name = "ResultCIV002", urlPatterns = {"/ResultCIV002"})
public class ResultCIV002 extends HttpServlet {
    
    private static Logger LOG = LogManager.getLogger(ResultCIV002.class);

    protected void processRequest(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        
        ApplicationContext appContext = WebApplicationContextUtils.getWebApplicationContext(this.getServletContext());
        PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);

        // Calling Servlet Transversal Util.
        ServletUtil.servletStart(request);

        /**
         * Adding Log entry.
         */
        ILogEventService logEventService = appContext.getBean(ILogEventService.class);
        logEventService.createForPublicCalls("/ResultCIV002", "CALL", "ResultCIV002 called : " + request.getRequestURL(), request);

        try {
            JSONObject jsonResponse = new JSONObject();

            String tag = policy.sanitize(request.getParameter("tag"));
            String outputFormat = policy.sanitize(request.getParameter("outputFormat"));

            String helpMessage = "This servlet is used to provide various execution counters as well as a global OK or KO status based on the number and status of the execution done on a specific tag. "
                    + "The number of executions are ponderated by parameters by priority from CI_OK_prio1 to CI_OK_prio4. "
                    + "Formula used is the following : "
                    + "Nb Exe Prio 1 testcases * CI_OK_prio1 + Nb Exe Prio 2 testcases * CI_OK_prio2 + "
                    + "Nb Exe Prio 3 testcases * CI_OK_prio3 + Nb Exe Prio 4 testcases * CI_OK_prio4."
                    + "If no executions are found, the result is KO."
                    + "With at least 1 execution, if result is < 1 then global servlet result is OK. If not, it is KO."
                    + "All execution needs to have a status equal to KO, FA, NA, PE or NE."
                    + "If at least 1 PE or 1 NE if found, global status will be PE"
                    + "Output format is json by default, or SVG if outputFormat=svg is defined"
                    + "Parameter list :"
                    + "- tag [mandatory] : Execution Tag to filter the test cases execution. [" + tag + "]"
                    + "- outputFormat    : ['json', 'svg']. Output format of the result. [" + outputFormat + "]";

            boolean error = false;
            String error_message = "";

            // Checking the parameter validity. Tag is a mandatory parameter
            if (StringUtils.isBlank(tag)) {
                error_message = "Error - Parameter tag is mandatory.";
                error = true;
            }

            // Checking the parameter validity. outputFormat can be empty, or equals to json or svg
            if (!StringUtils.isBlank(outputFormat) && !outputFormat.equals("json")
                    && !outputFormat.equals("svg")) {
                error_message = "Error - Value of parameter outputFormat is not recognized.";
                error = true;
            }

            if (!error) {

                ITestCaseExecutionService testExecutionService = appContext.getBean(TestCaseExecutionService.class);
                List<TestCaseExecution> myList;

                int nbok = 0;
                int nbko = 0;
                int nbfa = 0;
                int nbpe = 0;
                int nbne = 0;
                int nbna = 0;
                int nbca = 0;
                int nbqu = 0;
                int nbtotal = 0;

                int nbkop1 = 0;
                int nbkop2 = 0;
                int nbkop3 = 0;
                int nbkop4 = 0;

                long longStart = 0;
                long longEnd = 0;

                try {
                    myList = testExecutionService.readLastExecutionAndExecutionInQueueByTag(tag);

                    for (TestCaseExecution curExe : myList) {

                        if (longStart == 0) {
                            longStart = curExe.getStart();
                        }
                        if (curExe.getStart() < longStart) {
                            longStart = curExe.getStart();
                        }

                        if (longEnd == 0) {
                            longEnd = curExe.getEnd();
                        }
                        if (curExe.getEnd() > longEnd) {
                            longEnd = curExe.getEnd();
                        }

                        nbtotal++;

                        switch (curExe.getControlStatus()) {
                            case TestCaseExecution.CONTROLSTATUS_KO:
                                nbko++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_OK:
                                nbok++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_FA:
                                nbfa++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_NA:
                                nbna++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_CA:
                                nbca++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_PE:
                                nbpe++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_NE:
                                nbne++;
                                break;
                            case TestCaseExecution.CONTROLSTATUS_QU:
                                nbqu++;
                                break;
                        }

                        if (!curExe.getControlStatus().equals("OK") && !curExe.getControlStatus().equals("NE")
                                && !curExe.getControlStatus().equals("PE") && !curExe.getControlStatus().equals("QU")) {
                            switch (curExe.getTestCaseObj().getPriority()) {
                                case 1:
                                    nbkop1++;
                                    break;
                                case 2:
                                    nbkop2++;
                                    break;
                                case 3:
                                    nbkop3++;
                                    break;
                                case 4:
                                    nbkop4++;
                                    break;
                            }
                        }
                    }

                } catch (CerberusException ex) {
                    LOG.warn(ex);
                } catch (ParseException ex) {
                    LOG.warn(ex);
                }

                IParameterService parameterService = appContext.getBean(IParameterService.class);

                float pond1 = parameterService.getParameterFloatByKey("CI_OK_prio1", "", 0);
                float pond2 = parameterService.getParameterFloatByKey("CI_OK_prio2", "", 0);
                float pond3 = parameterService.getParameterFloatByKey("CI_OK_prio3", "", 0);
                float pond4 = parameterService.getParameterFloatByKey("CI_OK_prio4", "", 0);
                String result;
                float resultCal = (nbkop1 * pond1) + (nbkop2 * pond2) + (nbkop3 * pond3) + (nbkop4 * pond4);
                if ((nbtotal > 0) && nbqu + nbne + nbpe > 0) {
                    result = "PE";
                } else if ((resultCal < 1) && (nbtotal > 0)) {
                    result = "OK";
                } else {
                    result = "KO";
                }

                jsonResponse.put("messageType", "OK");
                jsonResponse.put("message", "CI result calculated with success.");
                jsonResponse.put("tag", tag);
                jsonResponse.put("CI_OK_prio1", pond1);
                jsonResponse.put("CI_OK_prio2", pond2);
                jsonResponse.put("CI_OK_prio3", pond3);
                jsonResponse.put("CI_OK_prio4", pond4);
                jsonResponse.put("CI_finalResult", resultCal);
                jsonResponse.put("NonOK_prio1_nbOfExecution", nbkop1);
                jsonResponse.put("NonOK_prio2_nbOfExecution", nbkop2);
                jsonResponse.put("NonOK_prio3_nbOfExecution", nbkop3);
                jsonResponse.put("NonOK_prio4_nbOfExecution", nbkop4);
                jsonResponse.put("status_OK_nbOfExecution", nbok);
                jsonResponse.put("status_KO_nbOfExecution", nbko);
                jsonResponse.put("status_FA_nbOfExecution", nbfa);
                jsonResponse.put("status_PE_nbOfExecution", nbpe);
                jsonResponse.put("status_NA_nbOfExecution", nbna);
                jsonResponse.put("status_CA_nbOfExecution", nbca);
                jsonResponse.put("status_NE_nbOfExecution", nbne);
                jsonResponse.put("status_QU_nbOfExecution", nbqu);
                jsonResponse.put("TOTAL_nbOfExecution", nbtotal);
                jsonResponse.put("result", result);
                jsonResponse.put("ExecutionStart", String.valueOf(new Timestamp(longStart)));
                jsonResponse.put("ExecutionEnd", String.valueOf(new Timestamp(longEnd)));

                generateResponse(response, outputFormat, jsonResponse, false);

                // Log the result with calculation detail.
                logEventService.createForPublicCalls("/ResultCIV001", "CALLRESULT", "ResultCIV002 calculated with result [" + result + "] : " + nbkop1 + "*" + pond1 + " + " + nbkop2 + "*" + pond2 + " + " + nbkop3 + "*" + pond3 + " + " + nbkop4 + "*" + pond4 + " = " + resultCal, request);

            } else {

                jsonResponse.put("messageType", "KO");
                jsonResponse.put("message", error_message);
                jsonResponse.put("helpMessage", helpMessage);
                generateResponse(response, outputFormat, jsonResponse, true);
            }

        } catch (JSONException e) {
            LOG.warn(e);
            //returns a default error message with the json format that is able to be parsed by the client-side
            response.getWriter().print(AnswerUtil.createGenericErrorAnswer());
        }

    }

    // <editor-fold defaultstate="collapsed"
    // desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

    private void generateResponse(HttpServletResponse response, String outputFormat, JSONObject jsonResponse, boolean error) throws IOException {
        if (StringUtils.isBlank(outputFormat) || outputFormat.equals("json") || error) {
            response.setContentType("application/json");
            response.setCharacterEncoding("utf8");
            response.getWriter().print(jsonResponse.toString());
        } else {
            response.setContentType("image/svg+xml");
            try (PrintWriter out = response.getWriter()){
            String responseSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"350\" height=\"20\">"
            
            +"<linearGradient id=\"b\" x2=\"0\" y2=\"100%\">"
            +"<stop offset=\"0\" stop-color=\"#bbb\" stop-opacity=\".1\"></stop>"
            +"<stop offset=\"1\" stop-opacity=\".1\"></stop>"
            +"</linearGradient>"
            //RECTANGLE
            +"<rect rx=\"3\" fill=\"#555\" width=\"250\" height=\"20\"></rect>"
            +"<rect rx=\"3\" x=\"210\" fill=\""+getColor(jsonResponse.getString("result"))+"\" width=\"40\" height=\"20\"></rect>"
            //TEXT        
            +"<g fill=\"#fff\" text-anchor=\"start\" font-family=\"DejaVu Sans,Verdana,Geneva,sans-serif\" font-size=\"9\">"
            +"<text x=\"10\" y=\"15\" fill=\"#010101\" fill-opacity=\".3\">"+StringUtils.substring(jsonResponse.getString("tag"),0,32)+"</text>"
            +"<text x=\"10\" y=\"14\">"+StringUtils.substring(jsonResponse.getString("tag"),0,32)+"</text>"
            +"<text x=\"225\" y=\"15\" fill=\"#010101\" fill-opacity=\".3\">"+jsonResponse.getString("result")+"</text>"
            +"<text x=\"225\" y=\"14\">"+jsonResponse.getString("result")+"</text>"
            +"</g>"
            +"</svg>";
            
           
            
            out.print(responseSvg);
            } catch (JSONException ex) {
                LOG.warn(ex);
            }

        }
    }

    private String getColor(String controlStatus) {
        String color = null;

        if ("OK".equals(controlStatus)) {
            color = "#5CB85C";
        } else if ("KO".equals(controlStatus)) {
            color = "#D9534F";
        } else {
            color = "#3498DB";
        }
        return color;
    }
}
