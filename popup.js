/****************
This JS is the main processing set - when DOM loaded, code is fired to prmopt for pushing the button
****************/ 
var config;  //object that will hold all configuration options
var blnStatusLoaded = false;
var statusArray;

//And so we begin....
document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);

/****************
Setup and configuration
****************/
function onDOMContentLoaded() {
    
    //Initialize the view
    document.getElementById("close-image").addEventListener ("click", function(){ closeit()}); 
    document.getElementById("refresh-image").addEventListener ("click", function(){ refreshit()}); 
    
    loadConfig("ev.json", function(response) { 

        //Get all of our config parameters
        config = JSON.parse(response); 

        //Get our statuses first
        step1LoadStatus();    
              
    });

}


//For loading JSON file locally - simulate REST API till we get one
function loadConfig(inputFileName, callback) {   

    try {
        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', inputFileName, true); 
        xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                    callback(xobj.responseText);
                }
                else {
                //    callback("");
                }
        };
        xobj.send(null);  
    }
    catch {
        callback("");
    }
}    

//Close the window when "Close Window" clicked
function closeit(){

    window.close();
    return false; //This causes the href to not get invoked
}


//Refresh the window when clicked
function refreshit(){

    window.location.reload(false);
    return false; //This causes the href to not get invoked
}


//Load the Status
function step1LoadStatus(inputDomain) {

    //Try to send
    try {

        //Build our object set
        var xhr = new XMLHttpRequest();
        xhr.open("GET", config.urlOfStatus, true);
        xhr.responseType = 'json';
        xhr.addEventListener("error", function() {console.log("Environment Version - Failed - Loading Statuses");});
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                //successful
                //We got it, set the array
                statusArray = xhr.response;

                //Get the most reacent for each domain
                statusArray.forEach(function(statusElement1) {
                    statusArray.forEach(function(statusElement2) {
                        if (statusElement1.host == statusElement2.host) {
                            //We hve a match, choose the most recent
                            if (statusElement1.id == statusElement2.id) {
                                //Its the same one, skip it
                            }
                            else {
                                var statusDate1 = new Date(statusElement1.insertDate);
                                var statusDate2 = new Date(statusElement2.insertDate);
                                if (statusDate2 > statusDate1) {
                                    //set the most recent
                                    statusElement2.mostRecent = true;
                                    statusElement1.mostRecent = false;
                                }
                                else {
                                    //set the most recent
                                    statusElement1.mostRecent = true;
                                    statusElement2.mostRecent = false;                                   
                                }
                            }
                        }
                    });               
                });

                //Now step 1 - load domains
                step2ProcessURLs();
            }
            else {
                //Failed
                console.log("Environment Version - Failed - Loading Statuses");
            }
        };        
        xhr.send();       
    }
    catch(err) {
        console.log("Environment Version - Failed - Loading Statuses");
    }

    return;

}

//Load Domains
function step2ProcessURLs() {

    var saveGroup = "";
    var outputGroup = "";
    var HTMLToLoad = "";
    var fullOutputHTML = "";
    var groupDomainOuput= "";

    config.domainsToGet.forEach(function(domainToRun) {
        if (domainToRun.runit) {
            //If same group, us that one        
            if (domainToRun.group != saveGroup) {
                //if not the first, write it out
                if (saveGroup != "") {
                    //if not the first, write it out
                    HTMLToLoad = HTMLToLoad.replace(/_DOMAINS_/gi, groupDomainOuput);
                    fullOutputHTML = fullOutputHTML + HTMLToLoad;
                }
                saveGroup = domainToRun.group;
                groupDomainOuput = "";
                HTMLToLoad = "";

                //Load new group
                outputGroup = document.getElementById("output-_GROUP_").outerHTML;
                HTMLToLoad = outputGroup.replace(/_GROUP_/gi, domainToRun.group);
                HTMLToLoad = HTMLToLoad.replace(/display:none;/gi, "display:block;");
            }

            //Get a new DOMAIN set and fill it in
            var outputDomain = document.getElementById("output-record-_DOMAIN_").outerHTML;
            outputDomain = outputDomain.replace(/_DOMAIN_/gi, domainToRun.domain);
            outputDomain = outputDomain.replace(/display:none;/gi, "display:block;");

            //if we are doing statuses
            if (domainToRun.doStatus) {
                //Fill in the status
                outputDomain = outputDomain.replace(/_STATUSMESSAGE_/gi, "Checkout Status: _ENVSTATUS_ as of  _STATUSDATE_");
                
                statusArray.forEach(function(statusElement) {
                    if (statusElement.mostRecent) {
                        if (statusElement.host.toUpperCase() == domainToRun.domain.replace(".landsend.com", "").toUpperCase()) {
                            //Its a match, lest update status
                            outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, statusElement.status);
                            outputDomain = outputDomain.replace(/_STATUSDATE_/gi, statusElement.insertDate);
                            switch (statusElement.status) {
                                case "UP":
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "green");
                                default:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "red");
                            }
                        }
                    }
                });

                //Overload if not status found
                outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, "Unkown");
                outputDomain = outputDomain.replace(/_STATUSDATE_/gi, "Right Now");
                outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "black");
            }
            else {
                  //Overload if not status found
                  outputDomain = outputDomain.replace(/_STATUSMESSAGE_/gi, "");
                  outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "black");
                  outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, "");
                  outputDomain = outputDomain.replace(/_STATUSDATE_/gi, "--");
            }
 
            groupDomainOuput = groupDomainOuput + outputDomain; 

        }
    });   

    //We have build all of the HTML, write it out
    if (HTMLToLoad != "") {
        //Last one
        HTMLToLoad = HTMLToLoad.replace(/_DOMAINS_/gi, groupDomainOuput);
        fullOutputHTML = fullOutputHTML + HTMLToLoad;
    }

    //Here is where we write it out
    document.getElementById("output-log").innerHTML = document.getElementById("output-log").innerHTML + fullOutputHTML;

    //Now add the expand event listeners - of which our env lookup follows
    config.domainsToGet.forEach(function(domainToRun) {
        if (domainToRun.runit) {
            document.getElementById("output-record-" + domainToRun.domain).addEventListener("click", () => {
                //if opening it up (currently closed), the go get em
                if (!document.getElementById("output-record-" + domainToRun.domain).open) {
                    if (!domainToRun.gotEnvInfo) {
                        step3GetEnvInfo(domainToRun);
                    }
                }                
            });
        }
    });

}

//Get Environment info
function step3GetEnvInfo(inputDomain) {
    
    var urlToRun = "";
    var docID = "output-record-" + inputDomain.domain;
    var detailID = "output-details-" + inputDomain.domain;

     //Get the info for the domain
    if (inputDomain.domain.length > 0) {

        //We got it so let us know
        inputDomain.gotEnvInfo = true;

        //Replace our tags
        urlToRun = config.urlOfTester.replace("_DOMAIN_", inputDomain.domain);

        //Try to send
        try {

            //Increment out # of attempts
            inputDomain.tries = inputDomain.tries + 1;

            //Build our object set
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlToRun, true);

            xhr.responseType = 'json';
            xhr.addEventListener("error", function() {console.log("Environment Version - Failed - " + inputDomain.domain);});
            xhr.onload = function() {
                var status = xhr.status;
                if (status == 200) {
                    //Add it to the output report

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("Running...", "Done");
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_BUILDTIME_", xhr.response.buildTime);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSION_", xhr.response.frontEnd);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSIONSHARED_", xhr.response.frontEndShared);

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOICWEB_", xhr.response.legacyCOICWeb);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOSERVERDATE_", xhr.response.legacyCOServerDate);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILDDATE_", xhr.response.newCOBuildDate);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILD_", xhr.response.newCOBuild);

                } 
                else {
                    if (inputDomain.tries < 3) {
                        console.log("Environment Version - Failed Request - Trying Again - " + inputDomain.domain + " tries = " + inputDomain.tries);
                        step3GetEnvInfo(inputDomain);
                    }
                    else {
                        //Failed
                        console.log("Environment Version - Failed - " + inputDomain.domain);
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("Running...", "Took Error: " + status + " = " + xhr.statusText);

                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_BUILDTIME_", "Error");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSION_", "Error");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSIONSHARED_", "Error");
    
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOICWEB_", "Error");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOSERVERDATE_", "Error");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILDDATE_", "Error");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILD_", "Error");
 
                    }
                 }
            };        
            xhr.send();       
        }
        catch(err) {
            console.log("Environment Version - Failed - " + inputDomain.domain);
        }
    }

    return;

}

