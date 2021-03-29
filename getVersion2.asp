<%
Option Explicit

Dim responseJSON1, responseJSON2, myDomain
Dim myVersionDictionary, myURLDictionary, myTimerDictionary
Set myVersionDictionary=Server.CreateObject("Scripting.Dictionary")
Set myURLDictionary=Server.CreateObject("Scripting.Dictionary")
Set myTimerDictionary=Server.CreateObject("Scripting.Dictionary")

'myDictionary.Add "gr","Green"
'Resopnse.write myDictionary.Item("gr"))
'myDictionary.Exists("gr")
'
myVersionDictionary.Add "current_release_version", "(unknown)"
myVersionDictionary.Add "ic_content_display_web_version_product", "Getting...."
myVersionDictionary.Add "ic_content_display_web_version_basket", "Getting...."

myVersionDictionary.Add "ic_web_tar_version", "Getting...."
myVersionDictionary.Add "ic_servlet_filters_version", "(not done - only on server)"

myVersionDictionary.Add "le_web_be_megalith_cd_version", "(not done - only on server)"
myVersionDictionary.Add "le_web_be_megalith_pd_version", "(not done - only on server)"

myVersionDictionary.Add "ic_web_fe_secure_checkout_version", "Getting...."
myVersionDictionary.Add "bcc_chai_version", "(not done - only on server)"
myVersionDictionary.Add "ic_mqwrapper_version", "(not done - only on server)"
myVersionDictionary.Add "bcc_pmos_version", "(not done - only on server)"
myVersionDictionary.Add "le_web_be_megalith_pub_version", "(not done - only on server)"
myVersionDictionary.Add "ic_inventory_version", "(not done - only on server)"
myVersionDictionary.Add "ic_storelocator_version", "(not done - only on server)"

myVersionDictionary.Add "ic_web_front_end_version_pdp", "Getting...."
myVersionDictionary.Add "ic_web_front_end_version_pmp", "Getting...."
myVersionDictionary.Add "ic_web_front_end_version_basket", "Getting...."
myVersionDictionary.Add "ic_web_front_end_version_myaccount", "Getting...."

myVersionDictionary.Add "ic_cgi_new_tar_version", "Coming...."

'Setup our URI's to get versioning from
'ic_content_display_web_version product and basket
myURLDictionary.Add "ic_content_display_web_version_product", "https://_DOMAIN_/api/info"
myURLDictionary.Add "ic_content_display_web_version_basket", "https://_DOMAIN_/co/api/info"

'ic_web_tar_version
myURLDictionary.Add "ic_web_tar_version", "https://_DOMAIN_/co/account/login"

'<!-- ic_web version:  100.12 : rddd2998 -->
'<!-- Served By: et21-qasa on Tuesday, 23-Mar-2021 09:39:12 CDT -->

'Servlet filters version
myURLDictionary.Add "ic_servlet_filters_version", ""

'Megalith CD and PD
myURLDictionary.Add "le_web_be_megalith_cd_version", ""  'Megalith CD
myURLDictionary.Add "le_web_be_megalith_pd_version", ""  'Megalith PD

'FE Secure CO version
myURLDictionary.Add "ic_web_fe_secure_checkout_version", "https://_DOMAIN_/secure-checkout/start"  'ic_web_fe_sercure_checkout_version

'Several others we dont have yet
myURLDictionary.Add "bcc_chai_version", ""
myURLDictionary.Add "ic_mqwrapper_version", ""
myURLDictionary.Add "bcc_pmos_version", ""
myURLDictionary.Add "le_web_be_megalith_pub_version", ""
myURLDictionary.Add "ic_inventory_version", ""
myURLDictionary.Add "ic_storelocator_version", ""

'Web FE version variants
myURLDictionary.Add "ic_web_front_end_version_pdp", "https://_DOMAIN_/products/mens-short-sleeve-super-soft-supima-polo-shirt-with-pocket/id_248708"  'ic_web_front_end_version pdp
myURLDictionary.Add "ic_web_front_end_version_pmp", "https://_DOMAIN_/shop/mens-polo-shirts-tops/S-xfe-xez-y5b-yqm-xec?cm_re=lec-_-mns-_-global-_-glbnv-polo-shirts-_-20160316-_-txt"  'ic_web_front_end_version pmp
myURLDictionary.Add "ic_web_front_end_version_basket", "https://_DOMAIN_/shopping-bag"  'ic_web_front_end_version basket
myURLDictionary.Add "ic_web_front_end_version_myaccount", "https://_DOMAIN_/co/account/login"  'ic_web_front_end_version MyAccount

'CGI New Tar Version - http:.//hostName:port/www/docroots/fcgi-bin/checkout.cgi
'myURLDictionary.Add "ic_cgi_new_tar_version", "http://leusex12:2080/www/docroots/fcgi-bin/checkout.cgi" 'ic_cgi_new_tar_version OR amazonaws.com/mqwrapper/cgi
myURLDictionary.Add "ic_cgi_new_tar_version", "" 'ic_cgi_new_tar_version OR amazonaws.com/mqwrapper/cgi


Dim blnError, item
	
If Len(Request.QueryString("domain")) > 0 Then
	myDomain = Request.QueryString("domain")

	Call getWebSiteInfo(myDomain)
	
	'If Took error, try again
	If blnError Then
		sleep(1000)
		Call getWebSiteInfo(myDomain)		
		If blnError Then
			sleep(1000)
			Call getWebSiteInfo(myDomain)		
		End If
	End If
	
	Call response.addheader ("Content-Type", "application/json;charset=UTF-8")

	responseJSON1 = "{"
	For Each item In myVersionDictionary
		If Len(responseJSON1) > 2 Then
			responseJSON1 = responseJSON1 + ","
		End If
		If InStr(myVersionDictionary.Item(item), "{") > 0 Then
			responseJSON1 = responseJSON1 + """" + item + """:" + myVersionDictionary.Item(item) 		
		Else
			responseJSON1 = responseJSON1 + """" + item + """:""" + myVersionDictionary.Item(item) + """"			
		End If
	Next
	responseJSON1 = responseJSON1 + "}"

	responseJSON2 = "{"
	'Spit out our URL's also
	For Each item In myURLDictionary
		If Len(responseJSON2) > 2 Then
			responseJSON2 = responseJSON2 + ","
		End If
		If InStr(myURLDictionary.Item(item), "{") > 0 Then
			responseJSON2 = responseJSON2 + """" + item + """:" + myURLDictionary.Item(item) 		
		Else
			responseJSON2 = responseJSON2 + """" + item + """:""" + myURLDictionary.Item(item) + """"			
		End If
	Next
	responseJSON2 = responseJSON2 + "}"
		
	Call Response.write("{""versions"":" + responseJSON1 + ", ""urls"":" + responseJSON2 + "}")

Else
	response.write "No domain:" + Request.QueryString
End If


Function getWebSiteInfo(myDomain)

	Dim myURL, myLegacyCOURL, myNewCOURL, myFrontEndVersionURL
	Dim myPageData, myPageStatus, item, versionItem, myVersion, myKey, urlItem, totalTime
	
	blnError = false	

	'Here are the URLs we will need to get version info
	For Each urlItem In myURLDictionary
		myKey = urlItem
		'This first - front-end URLs
		myURL = Replace(myURLDictionary.Item(urlItem), "_DOMAIN_", myDomain)
		myPageStatus = getPage(myURL, myPageData, totalTime)
		If myPageStatus = "Success" Then
			myVersion = getVersion(myPageData)
			For Each versionItem In myVersionDictionary
				If myVersionDictionary.Exists(myKey) Then
					myVersionDictionary.Item(myKey) = myVersion					
				End If
				If myTimerDictionary.Exists(myKey) Then
					myTimerDictionary.Item(myKey) = totalTime	
				Else
					myTimerDictionary.Add myKey, totalTime
				End If
				
			Next
		Else
			myVersion = "(unknown)"
			blnError = true
		End If

	Next

End Function

Function getPage(myURL, myPageData, outputTime)

	Dim lResolve, lConnect, lSend, lReceive
	Dim HTTPObject, startTime
	
	On Error Resume Next
	
	startTime = Timer
	
	If Len(myURL) <= 0 Then
		getPage = "Failed"
		Exit Function
	End If
	
	lResolve = 5 * 1000
	lConnect = 5 * 1000
	lSend = 5 * 1000
	lReceive = 5 * 1000

	' Create an xmlhttp object:
	Set HTTPObject = CreateObject("MSXML2.ServerXMLHTTP")
	
	'Try to ignore certificate errors
	Call HTTPObject.setOption(2, 13056)
	
	' Opens the connection to the remote server.
	Call HTTPObject.setTimeouts (lResolve, lConnect, lSend, lReceive)
	
	Call HTTPObject.Open ("GET", myURL, False)
	Call HTTPObject.SetRequestHeader ("Accept" , "*/*")
	Call HTTPObject.SetRequestHeader ("Accept-Language", "en-US,en;q=0.8")
	Call HTTPObject.SetRequestHeader ("Connection", "keep-alive")
	Call HTTPObject.SetRequestHeader ("Host", myURL)
	Call HTTPObject.SetRequestHeader ("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36")
	
	If Err.Number <> 0 Then
		'response.write ("Error:" & Err.Description)
		Err.Clear
		blnError = true
	ENd If
	
	'Response.Write("GETTING:" + myURL + "<br>")
	
	HTTPObject.Send
	
	If Err.Number <> 0 Then
		'Response.write ("Error:" & Err.Description)
		Err.Clear
		blnError = true
	ENd If

	If HTTPObject.status = 200 Then
		getPage = "Success"
		myPageData = HTTPObject.responseText
	Else
		getPage = HTTPObject.status & " = " + HTTPObject.statusText
		myPageData = ""
	End If
	
	outputTime = Timer - startTime
	
	Set HTTPObject = Nothing
	
End  Function

Function getVersion(myPageData)

	Dim myArray, i, myLine, myResponse, myVersion, myFullVersion
	
	'{"git.build.time":"2021-02-15T19:12:39-0600","git.commit.id.abbrev":"459ce4b","git.build.version":"100.12.2-RELEASE","git.commit.id.full":"459ce4bcefdec74416973002e3c2ed7ce1964102"}
	
	myFullVersion = ""
	
	If InStr(myPageData, "git.build.version") Then
		getVersion = myPageData
		Exit Function
	Else
		myArray = Split(myPageData, vbLf)
		'Response.Write "did not get<BR>"
	End If

'myVersionDictionary.Add "current_release_version", "(unknown)"
'myVersionDictionary.Add "ic_content_display_web_version", "Getting...."
'myVersionDictionary.Add "ic_web_tar_version", "Getting...."
'myVersionDictionary.Add "ic_servlet_filters_version", "(not done - only on server)"
'myVersionDictionary.Add "le_web_be_megalith_cd_version", "(not done - only on server)"
'myVersionDictionary.Add "le_web_be_megalith_pd_version", "(not done - only on server)"
'myVersionDictionary.Add "ic_web_fe_secure_checkout_version", "Getting...."
'myVersionDictionary.Add "bcc_chai_version", "(not done - only on server)"
'myVersionDictionary.Add "ic_mqwrapper_version", "(not done - only on server)"
'myVersionDictionary.Add "bcc_pmos_version", "(not done - only on server)"
'myVersionDictionary.Add "le_web_be_megalith_pub_version", "(not done - only on server)"
'myVersionDictionary.Add "ic_inventory_version", "(not done - only on server)"
'myVersionDictionary.Add "ic_storelocator_version", "(not done - only on server)"
'myVersionDictionary.Add "ic_web_front_end_version", "Getting...."
'myVersionDictionary.Add "ic_cgi_new_tar_version", "Getting...."
	
	

	For i = 0 To UBound(myArray) Step 1
		myLine = myArray(i)
		If InStr(myLine, "git.") Then
			'api info
			myVersion = Replace(myLine, """", "")
			myVersion = Replace(myVersion, ",", "")
			myVersion = Trim(myVersion)
			myFullVersion = appendVersion(myFullVersion, myVersion)
		ElseIf InStr(myLine, "<!DOCTYPE html><html lang=""en""><head>") Then
			If InStr(myArray(i+1), "<!-- ") Then
				'BUild Time is next
				myVersion = myArray(i + 1)
				myVersion = Replace(myVersion, "<!-- ", "")
				myVersion = Replace(myVersion, " -->", "")
				myVersion = Trim(myVersion)
				myVersion = "Build Time: " + Trim(myVersion)	
				myFullVersion = appendVersion(myFullVersion, myVersion)
			End IF
		ElseIf InStr(myLine, "<!-- @build:ic_front_end release/") Then
			'FE version
			myVersion = Replace(myLine, "<!-- @build:ic_front_end release/", "")
			myVersion = Replace(myVersion, " -->", "")
			myVersion = Trim(myVersion)
			myFullVersion = appendVersion(myFullVersion, myVersion)
		ElseIf InStr(myLine, "<!-- @build:ic_front_end_shared release/") Then
			'FE Shared Version
			myVersion = Replace(myLine, "<!-- @build:ic_front_end_shared release/", "")
			myVersion = Replace(myVersion, " -->", "")
			myVersion = Trim(myVersion)
			myFullVersion = appendVersion(myFullVersion, myVersion)
		ElseIf InStr(myLine, "<!-- ic_web version:") Then
			'COICWSeb Version
			myVersion = Replace(myLine, "<!-- ic_web version:", "")
			myVersion = Replace(myVersion, " -->", "")
			myVersion = Trim(myVersion)
			myFullVersion = appendVersion(myFullVersion, myVersion)
		'ElseIf InStr(myLine, "<!-- Served By:") Then
		'	'CO Server Date
		'	myVersion = Replace(myLine, "<!-- Served By:", "")
		'	myVersion = Replace(myVersion, " -->", "")
		'	myVersion = Trim(myVersion)
		ElseIf InStr(myLine, "<!doctype html>") Then
			If InStr(myArray(i+1), "<html lang=""en"">") And InStr(myArray(i+2), "<head>") Then
				If InStr(myArray(i+3), "<!-- ") Then
					'CO Build Date
					myVersion = Replace(myArray(i+3), "<!-- ", "")
					myVersion = Replace(myVersion, " -->", "")
					myVersion = Trim(myVersion)
					 myVersion = "Build Time: " + Trim(myVersion)
					myFullVersion = appendVersion(myFullVersion, myVersion)
				End IF
			End If
		ElseIf InStr(myLine, "<!-- @build ") Then
			'CO BUild
			myVersion = Replace(myLine, "<!-- @build ", "")
			myVersion = Replace(myVersion, " -->", "")
			myVersion = Trim(myVersion)
			myFullVersion = appendVersion(myFullVersion, myVersion)
		End If
	Next
	
	getVersion = myFullVersion

End Function

Function appendVersion(inputFullVersion, inputVersion)
	
	Dim responseVersion
	
	If Len(inputFullVersion) > 0 Then
		responseVersion = inputVersion + "<br>" + inputFullVersion 
	Else
		responseVersion = inputVersion	
	End If
	
	appendVersion = responseVersion
	
End Function


Function sleep(inputMilliseconds)
	
	On Error Resume Next

	Dim oShell
	Set oShell= Server.CreateObject("WScript.Shell")
	Call oShell.run("ping 1.1.1.1 -n 1 -w " & inputMilliseconds,1,TRUE) 

End Function

%>

	