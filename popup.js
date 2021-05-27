/****************
This JS is the main processing set - when DOM loaded, code is fired to prmopt for pushing the button
****************/ 
var config;  //object that will hold all configuration options
var blnStatusLoaded = false;
var statusArray;
var blnStatusLoaded = false;
var saveResponse;
var environmentHTML = "";
var version = "2021.05.26.2";
var orgKeyLocation = "http://leusnudev01.leinternal.com:8080/utility?action=fileget&filename=_FILENAME_";

//NEW VERSIONS TO GRAB
//https://le-deva2-aws.landsend.com/api/autocomplete/actuator/info
//https://le-deva2-aws.landsend.com/api/search/actuator/info


//And so we begin....
document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);

/****************
Setup and configuration
****************/
function onDOMContentLoaded() {
    
    //Initialize the view
    document.getElementById("close-image-status").addEventListener ("click", function(){ closeit()}); 
    document.getElementById("close-image-version").addEventListener ("click", function(){ showSection("status-info")}); 
    
    //Starting up, lets show it
    showSection("status-info");

    //var configURL = ev.json
    var configURL = orgKeyLocation.replace("_FILENAME_", "ev" + "-" + encodeURIComponent(version) + ".json");
    var status = "";
    loadConfig(configURL, function(returnStatus, response) { 

        if (returnStatus == "fail") {
            //Uh oh
            document.getElementById("error-message").style.display="inline-block";
            document.getElementById("error-message").innerHTML = document.getElementById("error-message").innerHTML.replace("_ERRORMESSAGE_", "There is a problem<br><br></br>Loading " + configURL + " = " + response);
        }
        else {

            //Get all of our config parameters
            config = JSON.parse(response);

            console.log("WE HAVE THIS: " + config.EnvironmentVersion.upgradeVersion + " VS " + version);

            //Handle Version
            if (config.EnvironmentVersion.upgradeVersion != version) {

                //New Version
                document.getElementById("error-message").style.display="inline-block";
                var versionMessage = config.EnvironmentVersion.upgradeMessage.replace("_UPGRADEVERSION_", config.EnvironmentVersion.upgradeVersion);
                versionMessage = versionMessage.replace("_DOWNLOADLOCATION_", config.EnvironmentVersion.upgradeDownloadLocation);
                document.getElementById("error-message").innerHTML = document.getElementById("error-message").innerHTML.replace("_ERRORMESSAGE_", versionMessage);
                   
   
                //   "downloadLocation": "https://github.com/alanhummer/EnvironmentVersion/archive/refs/heads/master.zip",
                //   "message": "We have a new version of Environment Versions! This version contains new stuff.",
                   
            }
            else {

                document.getElementById("error-message").style.display="none";

                //Get our statuses first - it will kick off the others
                step1LoadStatus();           
            } 
        } 
              
    });

}


//For loading JSON file locally - simulate REST API till we get one
function loadConfig(inputFileName, callback) {   

    try {
        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', inputFileName, true); 
        xobj.addEventListener("error", function() {console.log("Env Versions - failed - ");});
        xobj.onload = function () {
                if (xobj.status == "200") {
                    //confirm it is not bogus
                    if (!xobj.responseText.includes("EnvironmentVersion")) {
                        callback("fail", xobj.responseText);
                    }
                    else {
                        // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                        callback("success", xobj.responseText);
                    }

                }
                else {
                    if (xobj.statusText) {
                        callback("fail", xobj.status + " = " + xobj.statusText);
                    }
                    else {
                        callback("fail", xobj.status);
                    }

                }
        };
        xobj.send(null);  
    }
    catch {
        callback("fail", "Took bad error");
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

                if (statusArray) {

                    //Get the most reacent for each domain
                    statusArray.forEach(function(statusElement1) {
                        statusElement1.mostRecent = true;
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

                }

                //Status is loaded
                blnStatusLoaded = true;

                //We now have most recent per host, so spit em out
                statusArray.forEach(function(statusElement) {
                    console.log("STATUS FOR:", statusElement);
                    loadStepNumber(statusElement);
                    //And convert to cst
                    statusElement.insertDate = convertToCentralTime(statusElement.insertDate);
                    
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


//Load the Status
function loadParkMyCloudStatus(domainToRun) {

    var myResponse = "Loading PMC Status....";
    var myResponseColor = "black";
    var blnLoaded = false;
    var loopCount = 0;

    //Try to send
    try {

        //Build our object set
        var xhr = new XMLHttpRequest();
        xhr.open("GET", config.parkmycloudURI.replace(/_DOMAIN_/gi, domainToRun.domain), true);
        xhr.responseType = 'json';
        xhr.addEventListener("error", function() {console.log("Park My Cloud status failed");});
        xhr.onload = function() {
            var status = xhr.status;
            console.log("PMC GOT ONE: " + status + " FOR: " + domainToRun.domain);
            if (status == 503) {
                //This is parked
                myResponse = "PARKED";
                myResponseColor = "RED";
            }
            else {
                if (status == 200) {
                    //This is running
                    myResponse = "UP";
                    myResponseColor = "GREEN";
                }
                else {
                    myResponse = "DOWN";
                    myResponseColor = "RED";
                }
            }
            //Need replace ehere
            document.getElementById("pmc-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML = document.getElementById("pmc-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML.replace(/_PARKMYCLOUDSTATUS_/gi, myResponse);
            document.getElementById("site-properties-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML = document.getElementById("site-properties-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML.replace(/_PARKMYCLOUDSTATUS_/gi, myResponse);
            document.getElementById("site-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML = document.getElementById("site-link-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML.replace(/_PARKMYCLOUDSTATUS_/gi, myResponse);
 
            document.getElementById("output-record-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML = document.getElementById("output-record-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML.replace(/_PARKMYCLOUDSTATUS_/gi, myResponse);

            document.getElementById("output-record-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML = document.getElementById("output-record-_DOMAIN_".replace(/_DOMAIN_/gi, domainToRun.domain)).outerHTML.replace(/_PARKMYCLOUDSTATUSCOLOR_/gi, myResponseColor);
  
            setupLinks(domainToRun);

            blnLoaded = true;
        };        
        xhr.send();       
    }
    catch(err) {
        console.log("Park My Cloud Failed");
    }

    return myResponse;

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
            outputDomain = outputDomain.replace(/_DOMAINSHORT_/gi, domainToRun.domain.replace(".landsend.com", "").toUpperCase());
            outputDomain = outputDomain.replace(/display:none;/gi, "display:block;");

            //if we are doing statuses
            if (domainToRun.doStatus && blnStatusLoaded) {
                //Fill in the status
                outputDomain = outputDomain.replace(/_STATUSMESSAGE_/gi, "_ENVSTATUS_");
                
                statusArray.forEach(function(statusElement) {
                    if (statusElement.mostRecent) {
                        if (statusElement.host.toUpperCase() == domainToRun.domain.replace(".landsend.com", "").toUpperCase()) {
                            //Its a match, lets update status
                            domainToRun.statusStepNumberDesc = statusElement.stepNumberDesc;
                            domainToRun.statusStepNumber = statusElement.status;
                            domainToRun.statusDate = statusElement.insertDate;
                            outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, statusElement.stepNumberDesc + "<br>" + statusElement.status + " as of<br>" + statusElement.insertDate);
                            outputDomain = outputDomain.replace(/_STATUSDATE_/gi, statusElement.insertDate);
                            switch (statusElement.stepNumber) {
                                case 1:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#E00E00");
                                case 2:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#C41C00");
                                case 3:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#A82A00");
                                case 4:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#8C3800");
                                case 5:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#704600");
                                case 6:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#545400");
                                case 7:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#386200");
                                case 8:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#1C7000"); 
                                case 9:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#008000");
                                default:
                                    outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "#FF0000");
                            }
                        }
                    }
                });

                //Overload if not status found
                outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, "Unknown");
                outputDomain = outputDomain.replace(/_STATUSDATE_/gi, "Right Now");
                outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "red");
                groupDomainOuput = groupDomainOuput + outputDomain; 

            }
            else {
                  //Overload if not status found
                  outputDomain = outputDomain.replace(/_STATUSMESSAGE_/gi, "N/A");
                  outputDomain = outputDomain.replace(/_ENVSTATUSCOLOR_/gi, "black");
                  outputDomain = outputDomain.replace(/_ENVSTATUS_/gi, "N/A");
                  outputDomain = outputDomain.replace(/_STATUSDATE_/gi, "N/A");
                  groupDomainOuput = groupDomainOuput + outputDomain; 
            }
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
            //And to PMC, then continue on and load more stuff
            loadParkMyCloudStatus(domainToRun);
        }
    });
    
}

//2B for getting the manifest
function getManifest(inputDomain) {

    var urlToRun = "";

    switch(inputDomain) {
        case "le-qasa-aws.landsend.com":
        case "le-devc-aws.landsend.com":
            urlToRun = config.manifestQA;
            break;
        case "origin-aws-useast-1-www.landsend.com":
        case "origin-aws-uswest-2-www.landsend.com":
        case "www.landsend.com":
            urlToRun = config.manifestProd;
            break;
        default:
            urlToRun = config.manifestDev;
            break;
    }

    //Try to send
    try {

        var overrideversion = "";
        var webversion = "";
        var tarversion = "";
        var coversion = "";
        var feversion = "";

        //Build our object set
        var xhr = new XMLHttpRequest();
        xhr.open("GET", urlToRun, true);

        //xhr.responseType = 'html';
        xhr.addEventListener("error", function() {console.log("Manifest Get - Failed - " + urlToRun);});
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                console.log("GOT MANIFEST:" + xhr.response);
                myManifest = xhr.response;
                var manifestEntries = xhr.response.split("\n");
                var outputManifest = "";
                manifestEntries.forEach(function(manifestEntry) {
                    if (manifestEntry.includes("current_release_version")) {
                        if (overrideversion == "") {
                            overrideversion = manifestEntry.replace("current_release_version: ", "");
                            overrideversion = overrideversion.replace(/"/g, '');
                        }
                        else {
                            manifestEntry = manifestEntry.replace("{{ current_release_version }}", overrideversion);
                        }
                    }
                    if (manifestEntry.includes("ic_content_display_web_version: ")) {
                        webversion = manifestEntry.replace("ic_content_display_web_version: ", "");
                        webversion = webversion.replace(/"/g, '');
                    }
                    if (manifestEntry.includes("ic_web_tar_version: ")) {
                        tarversion = manifestEntry.replace("ic_web_tar_version: ", "");
                        tarversion = tarversion.replace(/"/g, '');
                    }
                    if (manifestEntry.includes("ic_web_fe_secure_checkout_version: ")) {
                        coversion = manifestEntry.replace("ic_web_fe_secure_checkout_version: ", "");
                        coversion = coversion.replace(/"/g, '');
                    }
                    if (manifestEntry.includes("ic_web_front_end_version: ")) {
                        feversion = manifestEntry.replace("ic_web_front_end_version: ", "");
                        feversion = feversion.replace(/"/g, '');
                    }
                    outputManifest = outputManifest + manifestEntry + "<br>";
                });
                showManifest(outputManifest, inputDomain, webversion, tarversion, coversion, feversion); 
            } 
            else {
            }
        };        
        xhr.send();       
    }
    catch(err) {
        console.log("Manifest Get - Failed - " + urlToRun);
    }

    return;

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
        urlToRun = config.urlOfVersion.replace("_DOMAIN_", inputDomain.domain);

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
                saveResponse = xhr.response;
                if (status == 200) {
                    //Add it to the output report
                    loadVersionDisplay(xhr, inputDomain);
                } 
                else {
                    if (inputDomain.tries < 3) {
                        console.log("Environment Version - Failed Request - Trying Again - " + inputDomain.domain + " tries = " + inputDomain.tries);
                        step3GetEnvInfo(inputDomain);
                    }
                    else {
                        //We errored out, but got to show that
                        loadVersionDisplay(null, inputDomain);

                        //Failed
                        console.log("Environment Version - Failed - " + inputDomain.domain);
    
                    }
                }
                getManifest(inputDomain.domain);

            };        
            xhr.send();       
        }
        catch(err) {
            console.log("Environment Version - Failed - " + inputDomain.domain);
        }
    }

    return;

}

//Open link in a new window
function httpLink(inputURI, inputType, inputDomain) {

    console.log("DID LINK:" + inputURI);
    chrome.windows.create ({
        url: inputURI,
        type: inputType
    });

    //window.open(inputURI);
    return false;
}

//loadStepNumber
function loadStepNumber(inputStatus) {

    var stepNumber = "";
    var maxNumber =  0;

    //How many do we have?
    config.statuses.forEach(function(status) {
        if (status.number > maxNumber) {
            maxNumber = status.number;
        }
    });

    //What step are we in?
    config.statuses.forEach(function(status) {
        if (status.name == inputStatus.status) {
            stepNumber = status.number;
        }        
    });

    inputStatus.stepNumber = stepNumber;
    inputStatus.stepNumberDesc = stepNumber + " of " + maxNumber;;

}


/****************
convertToCentralTime -
****************/ 
function convertToCentralTime(inputTimeStarted) {

    var dateJan;
    var dateJul;
    var timezoneOffset;
    var ampm;
    
    // Set initial date value
    dateValue = new Date(inputTimeStarted);
    
    // Get dates for January and July
    dateJan = new Date(dateValue.getFullYear(), 0, 1);
    dateJul = new Date(dateValue.getFullYear(), 6, 1);
    
    // Get timezone offset
    timezoneOffset = Math.max(dateJan.getTimezoneOffset(), dateJul.getTimezoneOffset());
    
    // Check if daylight savings
    if (dateValue.getTimezoneOffset() < timezoneOffset) {
      // Adjust date by 5 hours
      dateValue = new Date(dateValue.getTime() - ((1 * 60 * 60 * 1000) * 5));
    }
    else {
      // Adjust date by 6 hours
      dateValue = new Date(dateValue.getTime() - ((1 * 60 * 60 * 1000) * 6));
    }

    let ye = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(dateValue);
    let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(dateValue);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(dateValue);
    let hr = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }).format(dateValue);
    if (hr < 12) {
        ampm = "AM";
    }
    else {
        hr = hr - 12;
        ampm = "PM";
    }
    let mn = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(dateValue);
    
    return mo + "/" + da + "/" + ye + " " + hr + ":" + mn + ampm;

}


//Sleep function, like what every other language has
function sleep(inputMS) {
    let timeStart = new Date().getTime(); 
    while (true) { 
        let elapsedTime = new Date().getTime() - timeStart; 
        if (elapsedTime > inputMS) { 
        break; 
        } 
    } 
}

function setupLinks(domainToRun) {
    
    console.log("SETUP LINKS: " + domainToRun.domain);

    if (!!document.getElementById("site-properties-link-" + domainToRun.domain).onclick) {
        //Skip it
    }
    else {
        document.getElementById("site-properties-link-" + domainToRun.domain).onclick = function () {
            httpLink("https://" + domainToRun.domain + "/api/site-properties", "popup", domainToRun.domain);
        }      
    }

    if (!!document.getElementById("site-link-" + domainToRun.domain).onclick) {
        //Skip it
    }
    else {
        document.getElementById("site-link-" + domainToRun.domain).onclick = function () {
            httpLink("https://" + domainToRun.domain, "normal", domainToRun.domain);
        }      
    }

    if (!!document.getElementById("pmc-link-" + domainToRun.domain).onclick) {
        //Skip it
    }
    else {
        document.getElementById("pmc-link-" + domainToRun.domain).onclick = function () {
            httpLink("https://console.parkmycloud.com/#/resources/", "normal", domainToRun.domain);
        }
    }
 
    if (!!document.getElementById("version-detail-" + domainToRun.domain).onclick) {
        //Skip it
    }
    else {
        document.getElementById("version-detail-" + domainToRun.domain).onclick = function () {

        document.getElementById("header-message-version").innerHTML = "Loading.....";

            showSection("version-info");
            document.getElementById("hourglass-timer").style.display="inline-block";
            document.getElementById("version-info-details").innerHTML = "";

            //if opening it up (currently closed), the go get em
            //if (!domainToRun.gotEnvInfo) { //Always get the verion info
                //Get the info
                step3GetEnvInfo(domainToRun);                    
            //}
            //OK, show it off
            showSection("version-info");
        }   
    }

    if (!!document.getElementById("status-link-" + domainToRun.domain).onclick) {
        //Skip it
    }
    else {
        document.getElementById("status-link-" + domainToRun.domain).onclick = function () {
            httpLink("http://leusnudev01:8080/checkout-status?days=0&hours=3", "popup", domainToRun.domain);
        }
    }

}

//Show section we want to see, turn off the rest
function showSection(inputSection) {

    document.getElementById("version-info").style.display = "none";
    document.getElementById("status-info").style.display = "none";
    document.getElementById(inputSection).style.display = "inline-block";

}

//Load version info
function loadVersionDisplay(xhr, inputDomain) {

    var myVersionInfoTable = "";

    //Clear version-info-details
    document.getElementById("version-info-details").innerHTML = "";

    //Grab HTML table
    myVersionInfoTable = document.getElementById("version-info-table").innerHTML;
    myVersionInfoTable = myVersionInfoTable.replace(/_DOMAIN_/g, inputDomain.domain);

    //Replace all the elements
    if (xhr) {
        myVersionInfoTable = myVersionInfoTable.replace(/Running.../g, "Done");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_product.git.build.time", xhr.response.versions.ic_content_display_web_version_product['git.build.time']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_product.git.build.version", xhr.response.versions.ic_content_display_web_version_product['git.build.version']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_product.git.commit.id.abbrev", xhr.response.versions.ic_content_display_web_version_product['git.commit.id.abbrev']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_product.git.commit.id.full", xhr.response.versions.ic_content_display_web_version_product['git.commit.id.full']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_basket.git.build.time", xhr.response.versions.ic_content_display_web_version_basket['git.build.time']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_basket.git.build.version", xhr.response.versions.ic_content_display_web_version_basket['git.build.version']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_basket.git.commit.id.abbrev", xhr.response.versions.ic_content_display_web_version_basket['git.commit.id.abbrev']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version_basket.git.commit.id.full", xhr.response.versions.ic_content_display_web_version_basket['git.commit.id.full']);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_tar_version", xhr.response.versions.ic_web_tar_version);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_fe_secure_checkout_version", xhr.response.versions.ic_web_fe_secure_checkout_version);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version_pdp", xhr.response.versions.ic_web_front_end_version_pdp);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version_pmp", xhr.response.versions.ic_web_front_end_version_pmp);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version_basket", xhr.response.versions.ic_web_front_end_version_basket);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version_myaccount", xhr.response.versions.ic_web_front_end_version_myaccount);
    
    }
    else {
        myVersionInfoTable = myVersionInfoTable.replace(/Running.../g, "Took Error: " + status + " = " + xhr.statusText);
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.product.git.build.com", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.product.git.commit.id.abbrev", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.product.git.build.version", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.product.git.commit.id.full", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.basket.git.build.com", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.basket.git.commit.id.abbrev", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.basket.git.build.version", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_content_display_web_version.basket.git.commit.id.full", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_tar_version", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_fe_secure_checkout_version", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version.pdp", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version.pmp", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version.basket", "Error...");
        myVersionInfoTable = myVersionInfoTable.replace("versions.ic_web_front_end_version.myaccount", "Error...");
    
    }
    
    //And our status/date
    if (inputDomain.statusStepNumberDesc) {
        myVersionInfoTable = myVersionInfoTable.replace("_ENVSTATUS_", inputDomain.statusStepNumberDesc + " " + inputDomain.statusStepNumber);
        myVersionInfoTable = myVersionInfoTable.replace("_STATUSDATE_", inputDomain.statusDate);
    }
    else {
        myVersionInfoTable = myVersionInfoTable.replace("_ENVSTATUS_", "(not available)");
        myVersionInfoTable = myVersionInfoTable.replace("_STATUSDATE_", "");
    }

    document.getElementById("version-info-details").innerHTML = myVersionInfoTable;    

    //Reset our message
    document.getElementById("header-message-version").innerHTML = "Here is version information for " + inputDomain.domain;
    document.getElementById("hourglass-timer").style.display="none";

}

//Show Manifest Info
function showManifest(outputManifest, inputDomain, webversion, tarversion, coversion, feversion) {

    document.getElementById("version-info-details").innerHTML = document.getElementById("version-info-details").innerHTML.replace("_MANIFEST_", outputManifest);
    document.getElementById(inputDomain + '.match.ic_content_display_web_version_product.git.build.version').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_content_display_web_version_basket.git.build.version').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_tar_version').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_fe_secure_checkout_version').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_front_end_version_pdp').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_front_end_version_pmp').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_front_end_version_basket').innerHTML = "<font color='red'>NO MATCH</font>";
    document.getElementById(inputDomain + '.match.ic_web_front_end_version_myaccount').innerHTML = "<font color='red'>NO MATCH</font>";

    //Now load up our version matching statues
    if (saveResponse.versions.ic_content_display_web_version_product['git.build.version'].includes(webversion)) {
        document.getElementById(inputDomain + '.match.ic_content_display_web_version_product.git.build.version').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_content_display_web_version_product.git.build.version').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_content_display_web_version_basket['git.build.version'].includes(webversion)) {
        document.getElementById(inputDomain + '.match.ic_content_display_web_version_basket.git.build.version').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_content_display_web_version_basket.git.build.version').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_tar_version.includes(tarversion)) {
        document.getElementById(inputDomain + '.match.ic_web_tar_version').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_tar_version').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_fe_secure_checkout_version.includes(coversion)) {
        document.getElementById(inputDomain + '.match.ic_web_fe_secure_checkout_version').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_fe_secure_checkout_version').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_front_end_version_pdp.includes(feversion)) {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_pdp').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_pdp').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_front_end_version_pmp.includes(feversion)) {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_pmp').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_pmp').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_front_end_version_basket.includes(feversion)) {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_basket').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_basket').innerHTML = "<font color='red'>NO MATCH</font>";
    }
    if (saveResponse.versions.ic_web_front_end_version_myaccount.includes(feversion)) {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_myaccount').innerHTML = "<font color='green'>MATCH</font>";                
    }
    else {
        document.getElementById(inputDomain + '.match.ic_web_front_end_version_myaccount').innerHTML = "<font color='red'>NO MATCH</font>";
    }
}

