/****************
This JS is the main processing set - when DOM loaded, code is fired to prmopt for pushing the button
****************/ 
var config;  //object that will hold all configuration options


//And so we begin....
document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);

/****************
Setup and configuration
****************/
function onDOMContentLoaded() {
    
    //Initialize the view
    document.getElementById("close-image").addEventListener ("click", function(){ closeit()}); 
    document.getElementById("help-image").addEventListener ("click", function(){ openHelp()}); 

    
    loadConfig("ev.json", function(response) { 

        //Get all of our config parameters
        config = JSON.parse(response); 

        config.domainsToGet.forEach(function(domainToRun) {
            var outputRecord = document.getElementById("output-record-_DOMAIN_").outerHTML;
            outputRecord = outputRecord.replace(/display: none;/gi, "display: block;");
            var docID = "output-record-" + domainToRun.domain;
            outputRecord = outputRecord.replace(/_DOMAIN_/gi, domainToRun.domain);
            outputRecord = outputRecord.replace(/_GROUP_/gi, domainToRun.group);
            document.getElementById("output-log").innerHTML = document.getElementById("output-log").innerHTML + outputRecord;
            document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_STATUS_", "Ready...");
        });        
              
    });

    document.getElementById("go-image").addEventListener ("click", function(){ getVersions()}); 

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

//Open Help
function openHelp(){

    alert("Not ready yet....");
    return false; //This causes the href to not get invoked
}

//Get Version
function getVersions() {

    //for each URL inc config
    config.domainsToGet.forEach(function(domainToRun) {
        domainToRun.tries = 0;
        getVersion(domainToRun);
    });

}


//Get Version
function getVersion(inputDomain) {
    
    var urlToRun = "";
    var docID = "output-record-" + inputDomain.domain;
    var detailID = "output-details-" + inputDomain.domain;

     //Send EMail
    if (inputDomain.domain.length > 0) {

        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("Ready...", "Running...");

        //Replace our tags
        urlToRun = config.urlOfTester.replace("_DOMAIN_", inputDomain.domain);

        //Convert to encoded from data for posting
        //urlEncodedData = encodeURIComponent(config.orgEmailConfig.emailSubject) + "=" + encodeURIComponent(inputSubject)

        //URL encode it
        //urlEncodedData = urlEncodedData.replace( /%20/g, '+' );

        //Try to send
        try {

            //Increment out # of attempts
            inputDomain.tries = inputDomain.tries + 1;

            //Build our object set
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlToRun, true);

            //xhr.setRequestHeader( 'Content-Type', 'application/json' );
            //xhr.setRequestHeader( 'Content-Type', 'application/json' );

            xhr.responseType = 'json';
            xhr.addEventListener("error", function() {console.log("Environment Version - Failed - " + inputDomain.domain);});
            xhr.onload = function() {
                var status = xhr.status;
                if (status == 200) {
                    //successful
                    console.log("Environment Version - Succeeded - " + inputDomain.domain);
                    console.log("Environment Version response 2:" + xhr.response);
                    console.log(xhr);
                    //Add it to the output report

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("Running...", "Done");
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_BUILDTIME_", xhr.response.buildTime);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSION_", xhr.response.frontEnd);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_FRONTENDVERSIONSHARED_", xhr.response.frontEndShared);

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOICWEB_", xhr.response.legacyCOICWeb);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_LEGACYCOSERVERDATE_", xhr.response.legacyCOServerDate);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILDDATE_", xhr.response.newCOBuildDate);
                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("_NEWCOBUILD_", xhr.response.newCOBuild);

                    document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace(/display:none;/gi, "display: block;");
                    //document.getElementById("output-log").innerHTML = document.getElementById("output-log").innerHTML + xhr.response.domain + " = " + xhr.response.buildTime + "<br>"
                } 
                else {
                    if (inputDomain.tries < 3) {
                        console.log("Trying Again - " + inputDomain.domain + " tries = " + inputDomain.tries);
                        getVersion(inputDomain);
                    }
                    else {
                        //Failed
                        console.log("Environment Version - Failed - " + inputDomain.domain);
                        document.getElementById(docID).innerHTML = document.getElementById(docID).innerHTML.replace("Running...", "Took Error: " + status + " = " + xhr.statusText);
                    }
                 }
            };        
            xhr.send();       
            console.log("Environment Version response 1:" + xhr.response);
        }
        catch(err) {
            console.log("Environment Version - Failed - " + inputDomain.domain);
        }
    }

    return;

}