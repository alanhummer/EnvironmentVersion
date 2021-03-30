/****************
This JS is the main processing set - when DOM loaded, code is fired to prmopt for pushing the button
****************/ 
var config;  //object that will hold all configuration options
var blnStatusLoaded = false;
var statusArray;
var saveResponse;

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

        //Now step 1 - load domains
        step2ProcessURLs();

        //Get our statuses first
        //step1LoadStatus();    
              
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

                if (statusArray) {

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

                }

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

//2B for getting the manifest
function getManifest(inputDomain, docID) {

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
                document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_MANIFEST_", outputManifest);

                console.log("COMPARING AND TESTING: " + saveResponse.versions.ic_web_front_end_version_pdp + " FOR " + feversion);
 
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

                      /*
                ic_content_display_web_version: "100.14-SNAPSHOT" = .(2 of these)) match.ic_content_display_web_version_product.git.build.versio
                ic_web_tar_version: "100.14.0" .match.ic_web_tar_version
                ic_web_fe_secure_checkout_version: "100.14.0" = match.ic_web_fe_secure_checkout_version
                ic_web_front_end_version: "100.14.0"   (4 of theise) match.ic_web_front_end_version_myaccount

  */
                
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
                saveResponse = xhr.response;
                if (status == 200) {
                    //Add it to the output report
                    document.getElementById(detailID).style.display =  'block';

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace(/Running.../g, "Done");

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_product.git.build.time", xhr.response.versions.ic_content_display_web_version_product['git.build.time']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_product.git.build.version", xhr.response.versions.ic_content_display_web_version_product['git.build.version']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_product.git.commit.id.abbrev", xhr.response.versions.ic_content_display_web_version_product['git.commit.id.abbrev']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_product.git.commit.id.full", xhr.response.versions.ic_content_display_web_version_product['git.commit.id.full']);

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_basket.git.build.time", xhr.response.versions.ic_content_display_web_version_basket['git.build.time']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_basket.git.build.version", xhr.response.versions.ic_content_display_web_version_basket['git.build.version']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_basket.git.commit.id.abbrev", xhr.response.versions.ic_content_display_web_version_basket['git.commit.id.abbrev']);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version_basket.git.commit.id.full", xhr.response.versions.ic_content_display_web_version_basket['git.commit.id.full']);
                    
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_tar_version", xhr.response.versions.ic_web_tar_version);

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_fe_secure_checkout_version", xhr.response.versions.ic_web_fe_secure_checkout_version);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version_pdp", xhr.response.versions.ic_web_front_end_version_pdp);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version_pmp", xhr.response.versions.ic_web_front_end_version_pmp);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version_basket", xhr.response.versions.ic_web_front_end_version_basket);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version_myaccount", xhr.response.versions.ic_web_front_end_version_myaccount);
                } 
                else {
                    if (inputDomain.tries < 3) {
                        console.log("Environment Version - Failed Request - Trying Again - " + inputDomain.domain + " tries = " + inputDomain.tries);
                        step3GetEnvInfo(inputDomain);
                    }
                    else {

                        document.getElementById(detailID).style.display =  'block';

                        //Failed
                        console.log("Environment Version - Failed - " + inputDomain.domain);
  
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace(/Running.../g, "Took Error: " + status + " = " + xhr.statusText);
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.product.git.build.com", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.product.git.commit.id.abbrev", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.product.git.build.version", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.product.git.commit.id.full", "Error...");
    
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.basket.git.build.com", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.basket.git.commit.id.abbrev", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.basket.git.build.version", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_content_display_web_version.basket.git.commit.id.full", "Error...");
                        
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_tar_version", "Error...");
    
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_fe_secure_checkout_version", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version.pdp", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version.pmp", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version.basket", "Error...");
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("versions.ic_web_front_end_version.myaccount", "Error...");
    
                    }
                }
                getManifest(inputDomain.domain, docID);

            };        
            xhr.send();       
        }
        catch(err) {
            console.log("Environment Version - Failed - " + inputDomain.domain);
        }
    }

    return;

}

