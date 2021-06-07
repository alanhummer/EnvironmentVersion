var pageLoadCount = 0;
var urlOfSiteProperties = "http://leusnudev01.leinternal.com:8080/utility?action=relay&relayURI=https://_DOMAIN_/api/site-properties";
var urlOfVersions = "http://leusnudev01.leinternal.com:8080/utility?action=version&domain=_DOMAIN_";

//Get the URL's that hold the text to compare
var domain1 = getParameterByName('domain1');
var domain2 = getParameterByName('domain2');
var compareType = getParameterByName('compareType');
if (compareType == "version") {
    var compareLeft = urlOfVersions.replace("_DOMAIN_", domain1);
    var compareRight = urlOfVersions.replace("_DOMAIN_", domain2);
}
else {
    //"properties" or otherwise
    var compareLeft = urlOfSiteProperties.replace("_DOMAIN_", domain1);
    var compareRight = urlOfSiteProperties.replace("_DOMAIN_", domain2);
}



var textLeft = "";
var textRight = "";

//Here we go, make the calls to get our data
loadPage(compareLeft, function(returnStatus, response) { 

    if (returnStatus == "fail") {
        //Uh oh
        console.log("It failed: " + response);
        outputJSON = response;
    }
    else {

        //HERE IS WHERE WE GO    
        
        //Fill in reponse set
        outputJSON = JSON.parse(response);            
        textLeft = JSON.stringify(outputJSON, null, 2);

        loadPage(compareRight, function(returnStatus2, response2) { 

            if (returnStatus2 == "fail") {
                //Uh oh
                console.log("It failed: " + response2);
                outputJSON = response2;
            }
            else {
                //Got em both, so show it off
                outputJSON = JSON.parse(response2);    
                textRight = JSON.stringify(outputJSON, null, 2);
                var byId = function (id) { return document.getElementById(id); },
                base = difflib.stringAsLines(textLeft), //HERE IS DATA LEFT
                newtxt = difflib.stringAsLines(textRight), //HERE IS DATA RIGHT
                sm = new difflib.SequenceMatcher(base, newtxt),
                opcodes = sm.get_opcodes(),
                diffoutputdiv = byId("diffoutput"),
                contextSize = null;
            
                diffoutputdiv.innerHTML = "";
                contextSize = contextSize || null;

                diffoutputdiv.appendChild(diffview.buildView({
                    baseTextLines: base,
                    newTextLines: newtxt,
                    opcodes: opcodes,
                    baseTextName: compareLeft,
                    newTextName: compareRight,
                    contextSize: contextSize,
                    viewType: 0
                }));
                
                //Let resize too
                window.moveTo(0, 0);
                window.resizeTo(screen.availWidth, screen.availHeight);
            };
        });    
    } 
});

//Go get the page over hTTP
function loadPage(inputURI, callback) {   

    try {
        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', inputURI, true); 
        xobj.addEventListener("error", function() {console.log("Env Versions - failed - ");});
        xobj.onload = function () {
                if (xobj.status == "200") {
                    //confirm it is not bogus
                    if (!xobj.responseText.includes('"version')) {
                        console.log("DOES NOT HAVE VERSION");
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

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}