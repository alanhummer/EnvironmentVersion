<%
Option Explicit

Dim responseJSON, myDomain, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild
Dim blnError
	
If Len(Request.QueryString("domain")) > 0 Then
	myDomain = Request.QueryString("domain")

	'/api/info
	'/co/api/info
	'

	Call getWebSiteInfo(myDomain, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)
	
	'If Took error, try again
	If blnError Then
		sleep(1000)
		Call getWebSiteInfo(myDomain, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)		
		If blnError Then
			sleep(1000)
			Call getWebSiteInfo(myDomain, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)		
		End If
	End If
	
	Call response.addheader ("Content-Type", "application/json;charset=UTF-8")

	responseJSON = "{""domain"":""_DOMAIN_"",""buildTime"":""_BUILDTIME_"",""frontEnd"":""_FRONTEND_"",""frontEndShared"":""_FRONTENDSHARED_"",""legacyCOICWeb"":""_LEGACYCOICWEB_"",""legacyCOServerDate"":""_LEGACYSERVERDATE_"",""newCOBuildDate"":""_NEWCOBUILDDATE_"",""newCOBuild"":""_NEWCOBUILD_""}"
	responseJSON = Replace(responseJSON, "_DOMAIN_", myDomain)
	responseJSON = Replace(responseJSON, "_BUILDTIME_", myBuildTime)
	responseJSON = Replace(responseJSON, "_FRONTEND_", myFrontEndVersion)
	responseJSON = Replace(responseJSON, "_FRONTENDSHARED_", myFrontEndSharedVersion)	
	responseJSON = Replace(responseJSON, "_LEGACYCOICWEB_", myLegacyCOICWebVersion)	
	responseJSON = Replace(responseJSON, "_LEGACYSERVERDATE_", myLegacyCOServerDate)	
	responseJSON = Replace(responseJSON, "_NEWCOBUILDDATE_", myNewCOBuildDate)
	responseJSON = Replace(responseJSON, "_NEWCOBUILD_", myNewCOBuild)	
			
	Call Response.write(responseJSON)
		
Else
	response.write "No domain:" + Request.QueryString
End If


Function getWebSiteInfo(myDomain, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)

	Dim myURL, myLegacyCOURL, myNewCOURL, myFrontEndVersionURL
	Dim myPageData, myPageStatus
	
	blnError = false
	
	myBuildTime = "(Unkown)"
	myFrontEndVersion = "(Unkown)"
	myFrontEndSharedVersion = "(Unkown)"	
	myLegacyCOICWebVersion = "(Unkown)"
	myLegacyCOServerDate = "(Unkown)"
	myNewCOBuildDate = "(Unkown)" 
	myNewCOBuild = "(Unkown)"
			
	myFrontEndVersionURL = "https://_DOMAIN_/products/mens-short-sleeve-super-soft-supima-polo-shirt-with-pocket/id_248708"
	myURL = Replace(myFrontEndVersionURL, "_DOMAIN_", myDomain)
	myPageStatus = getPage(myURL, myPageData)
	If myPageStatus = "Success" Then
		Call getVersion(myPageData, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)
	Else
		myBuildTime = "Error - " + myPageStatus
		myFrontEndVersion = "Error - " + myPageStatus
		myFrontEndSharedVersion = "Error - " + myPageStatus
		blnError = true
	End If

	myLegacyCOURL = "https://_DOMAIN_/co/account/login"
	myURL = Replace(myLegacyCOURL, "_DOMAIN_", myDomain)
	myPageStatus = getPage(myURL, myPageData)
	If myPageStatus = "Success" Then
		Call getVersion(myPageData, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)
	Else
		myLegacyCOICWebVersion = "Error - " + myPageStatus
		myLegacyCOServerDate = "Error - " + myPageStatus
		blnError = true
	End If
		
	myNewCOURL = "https://_DOMAIN_/secure-checkout/start"
	myURL = Replace(myNewCOURL, "_DOMAIN_", myDomain)
	myPageStatus = getPage(myURL, myPageData)
	If myPageStatus = "Success" Then
		Call getVersion(myPageData, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)
	Else
		myNewCOBuildDate = "Error - " + myPageStatus
		myNewCOBuild = "Error - " + myPageStatus
		blnError = true
	End If	
	
End Function

Function getPage(myURL, myPageData)

	Dim lResolve, lConnect, lSend, lReceive
	Dim HTTPObject
	
	On Error Resume Next
	
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
	
	Set HTTPObject = Nothing
	
End  Function

Function getVersion(myPageData, myBuildTime, myFrontEndVersion, myFrontEndSharedVersion, myLegacyCOICWebVersion, myLegacyCOServerDate, myNewCOBuildDate, myNewCOBuild)

	Dim myArray, i, myLine, myResponse


	myArray = Split(myPageData, vbLf)

	For i = 0 To UBound(myArray) Step 1
		myLine = myArray(i)
		If InStr(myLine, "<!DOCTYPE html><html lang=""en""><head>") Then
			If InStr(myArray(i+1), "<!-- ") Then
				'BUild Time is next
				myBuildTime = myArray(i + 1)
				myBuildTime = Replace(myBuildTime, "<!-- ", "")
				myBuildTime = Replace(myBuildTime, " -->", "")
				myBuildTime = Trim(myBuildTime)	
			End IF
		ElseIf InStr(myLine, "<!-- @build:ic_front_end release/") Then
			myFrontEndVersion = Replace(myLine, "<!-- @build:ic_front_end release/", "")
			myFrontEndVersion = Replace(myFrontEndVersion, " -->", "")
			myFrontEndVersion = Trim(myFrontEndVersion)
		ElseIf InStr(myLine, "<!-- @build:ic_front_end_shared release/") Then
			myFrontEndSharedVersion = Replace(myLine, "<!-- @build:ic_front_end_shared release/", "")
			myFrontEndSharedVersion = Replace(myFrontEndSharedVersion, " -->", "")
			myFrontEndSharedVersion = Trim(myFrontEndSharedVersion)
		ElseIf InStr(myLine, "<!-- ic_web version:") Then
			myLegacyCOICWebVersion = Replace(myLine, "<!-- ic_web version:", "")
			myLegacyCOICWebVersion = Replace(myLegacyCOICWebVersion, " -->", "")
			myLegacyCOICWebVersion = Trim(myLegacyCOICWebVersion)
		ElseIf InStr(myLine, "<!-- Served By:") Then
			myLegacyCOServerDate = Replace(myLine, "<!-- Served By:", "")
			myLegacyCOServerDate = Replace(myLegacyCOServerDate, " -->", "")
			myLegacyCOServerDate = Trim(myLegacyCOServerDate)
		ElseIf InStr(myLine, "<!doctype html>") Then
			If InStr(myArray(i+1), "<html lang=""en"">") And InStr(myArray(i+2), "<head>") Then
				If InStr(myArray(i+3), "<!-- ") Then
					myNewCOBuildDate = Replace(myArray(i+3), "<!-- ", "")
					myNewCOBuildDate = Replace(myNewCOBuildDate, " -->", "")
					myNewCOBuildDate = Trim(myNewCOBuildDate)
				End IF
			End If
		ElseIf InStr(myLine, "<!-- @build ") Then
			myNewCOBuild = Replace(myLine, "<!-- @build ", "")
			myNewCOBuild = Replace(myNewCOBuild, " -->", "")
			myNewCOBuild = Trim(myNewCOBuild)
		End If
	
	Next

End Function

Function sleep(inputMilliseconds)
	
	On Error Resume Next

	Dim oShell
	Set oShell= Server.CreateObject("WScript.Shell")
	Call oShell.run("ping 1.1.1.1 -n 1 -w " & inputMilliseconds,1,TRUE) 

End Function

%>

	