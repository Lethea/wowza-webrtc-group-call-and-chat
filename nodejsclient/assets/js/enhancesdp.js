var SDPOutput = new Object();
var videoChoice = "42e01f";
var audioChoice = "opus";
var videoIndex = -1;
var audioIndex = -1;
function addAudio(sdpStr, audioLine)
{
    var sdpLines = sdpStr.split(/\r\n/);
    var sdpSection = 'header';
    var hitMID = false;
    var sdpStrRet = '';
    var done = false;

    for(var sdpIndex in sdpLines)
    {
        var sdpLine = sdpLines[sdpIndex];

        if (sdpLine.length <= 0)
            continue;


        sdpStrRet +=sdpLine;
        sdpStrRet += '\r\n';

        if ( 'a=rtcp-mux'.localeCompare(sdpLine) == 0 && done == false )
        {
            sdpStrRet +=audioLine;
            done = true;
        }


    }
    return sdpStrRet;
}

function addVideo(sdpStr, videoLine)
{
    var sdpLines = sdpStr.split(/\r\n/);
    var sdpSection = 'header';
    var hitMID = false;
    var sdpStrRet = '';
    var done = false;

    var rtcpSize = false;
    var rtcpMux = false;

    for(var sdpIndex in sdpLines)
    {
        var sdpLine = sdpLines[sdpIndex];

        if (sdpLine.length <= 0)
            continue;

        if ( sdpLine.includes("a=rtcp-rsize") )
        {
            rtcpSize = true;
        }

        if ( sdpLine.includes("a=rtcp-mux") )
        {
            rtcpMux = true;
        }

    }

    for(var sdpIndex in sdpLines)
    {
        var sdpLine = sdpLines[sdpIndex];

        sdpStrRet +=sdpLine;
        sdpStrRet += '\r\n';

        if ( ('a=rtcp-rsize'.localeCompare(sdpLine) == 0 ) && done == false && rtcpSize == true)
        {
            sdpStrRet +=videoLine;
            done = true;
        }

        if ( 'a=rtcp-mux'.localeCompare(sdpLine) == 0 && done == true && rtcpSize == false)
        {
            sdpStrRet +=videoLine;
            done = true;
        }

        if ( 'a=rtcp-mux'.localeCompare(sdpLine) == 0 && done == false && rtcpSize == false )
        {
            done = true;
        }

    }
    return sdpStrRet;
}

function enhanceSDP(sdpStr, enhanceData)
{
    var sdpLines = sdpStr.split(/\r\n/);
    var sdpSection = 'header';
    var hitMID = false;
    var sdpStrRet = '';

    //console.log("Original SDP: "+sdpStr);

    // Firefox provides a reasonable SDP, Chrome is just odd
    // so we have to doing a little mundging to make it all work
    if ( !sdpStr.includes("THIS_IS_SDPARTA") || videoChoice.includes("VP9") )
    {
        for(var sdpIndex in sdpLines)
        {
            var sdpLine = sdpLines[sdpIndex];

            if (sdpLine.length <= 0)
                continue;

            var doneCheck = checkLine(sdpLine);
            if ( !doneCheck )
                continue;

            sdpStrRet +=sdpLine;
            sdpStrRet += '\r\n';

        }
        sdpStrRet =  addAudio(sdpStrRet, deliverCheckLine(audioChoice,"audio"));
        sdpStrRet =  addVideo(sdpStrRet, deliverCheckLine(videoChoice,"video"));
        sdpStr = sdpStrRet;
        sdpLines = sdpStr.split(/\r\n/);
        sdpStrRet = '';
    }

    for(var sdpIndex in sdpLines)
    {
        var sdpLine = sdpLines[sdpIndex];

        if (sdpLine.length <= 0)
            continue;

        if ( sdpLine.indexOf("m=audio") ==0 && audioIndex !=-1 )
        {
            audioMLines = sdpLine.split(" ");
            sdpStrRet+=audioMLines[0]+" "+audioMLines[1]+" "+audioMLines[2]+" "+audioIndex+"\r\n";
            continue;
        }

        if ( sdpLine.indexOf("m=video") == 0 && videoIndex !=-1 )
        {
            audioMLines = sdpLine.split(" ");
            sdpStrRet+=audioMLines[0]+" "+audioMLines[1]+" "+audioMLines[2]+" "+videoIndex+"\r\n";
            continue;
        }

        sdpStrRet += sdpLine;

        if (sdpLine.indexOf("m=audio") === 0)
        {
            sdpSection = 'audio';
            hitMID = false;
        }
        else if (sdpLine.indexOf("m=video") === 0)
        {
            sdpSection = 'video';
            hitMID = false;
        }
        else if (sdpLine.indexOf("a=rtpmap") == 0 )
        {
            sdpSection = 'bandwidth';
            hitMID = false;
        }

        if (sdpLine.indexOf("a=mid:") === 0 || sdpLine.indexOf("a=rtpmap") == 0 )
        {
            if (!hitMID)
            {
                if ('audio'.localeCompare(sdpSection) == 0)
                {
                    if (enhanceData.audioBitrate !== undefined)
                    {
                        sdpStrRet += '\r\nb=CT:' + (enhanceData.audioBitrate);
                        sdpStrRet += '\r\nb=AS:' + (enhanceData.audioBitrate);
                    }
                    hitMID = true;
                }
                else if ('video'.localeCompare(sdpSection) == 0)
                {
                    if (enhanceData.videoBitrate !== undefined)
                    {
                        sdpStrRet += '\r\nb=CT:' + (enhanceData.videoBitrate);
                        sdpStrRet += '\r\nb=AS:' + (enhanceData.videoBitrate);
                        if ( enhanceData.videoFrameRate !== undefined )
                        {
                            sdpStrRet += '\r\na=framerate:'+enhanceData.videoFrameRate;
                        }
                    }
                    hitMID = true;
                }
                else if ('bandwidth'.localeCompare(sdpSection) == 0 )
                {
                    var rtpmapID;
                    rtpmapID = getrtpMapID(sdpLine);
                    if ( rtpmapID !== null  )
                    {
                        var match = rtpmapID[2].toLowerCase();
                        if ( ('vp9'.localeCompare(match) == 0 ) ||  ('vp8'.localeCompare(match) == 0 ) || ('h264'.localeCompare(match) == 0 ) ||
                            ('red'.localeCompare(match) == 0 ) || ('ulpfec'.localeCompare(match) == 0 ) || ('rtx'.localeCompare(match) == 0 ) )
                        {
                            if (enhanceData.videoBitrate !== undefined)
                            {
                                sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.videoBitrate)+';x-google-max-bitrate='+(enhanceData.videoBitrate);
                            }
                        }

                        if ( ('opus'.localeCompare(match) == 0 ) ||  ('isac'.localeCompare(match) == 0 ) || ('g722'.localeCompare(match) == 0 ) || ('pcmu'.localeCompare(match) == 0 ) ||
                            ('pcma'.localeCompare(match) == 0 ) || ('cn'.localeCompare(match) == 0 ))
                        {
                            if (enhanceData.audioBitrate !== undefined)
                            {
                                sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.audioBitrate)+';x-google-max-bitrate='+(enhanceData.audioBitrate);
                            }
                        }
                    }
                }
            }
        }
        sdpStrRet += '\r\n';
    }
   // console.log("Resuling SDP: "+sdpStrRet);
    return sdpStrRet;
}

function deliverCheckLine(profile,type)
{
    var outputString = "";
    for(var line in SDPOutput)
    {
        var lineInUse = SDPOutput[line];
        outputString+=line;
        if ( lineInUse.includes(profile) )
        {
            if ( profile.includes("VP9") || profile.includes("VP8"))
            {
                var output = "";
                var outputs = lineInUse.split(/\r\n/);
                for(var position in outputs)
                {
                    var transport = outputs[position];
                    if (transport.indexOf("transport-cc") !== -1 || transport.indexOf("goog-remb") !== -1 || transport.indexOf("nack") !== -1)
                    {
                        continue;
                    }
                    output+=transport;
                    output+="\r\n";
                }

                if (type.includes("audio") )
                {
                    audioIndex = line;
                }

                if (type.includes("video") )
                {
                    videoIndex = line;
                }

                return output;
            }
            if (type.includes("audio") )
            {
                audioIndex = line;
            }

            if (type.includes("video") )
            {
                videoIndex = line;
            }
            return lineInUse;
        }
    }
    return outputString;
}

function checkLine(line)
{
    if ( line.startsWith("a=rtpmap") || line.startsWith("a=rtcp-fb") || line.startsWith("a=fmtp"))
    {
        var res = line.split(":");

        if ( res.length>1 )
        {
            var number = res[1].split(" ");
            if ( !isNaN(number[0]) )
            {
                if ( !number[1].startsWith("http") && !number[1].startsWith("ur") )
                {
                    var currentString = SDPOutput[number[0]];
                    if (!currentString)
                    {
                        currentString = "";
                    }
                    currentString+=line+"\r\n";
                    SDPOutput[number[0]]=currentString;
                    return false;
                }
            }
        }
    }

    return true;
}

function getrtpMapID(line)
{
    var findid = new RegExp('a=rtpmap:(\\d+) (\\w+)/(\\d+)');
    var found = line.match(findid);
    return (found && found.length >= 3) ? found: null;
}
