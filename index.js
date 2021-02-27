(function localFileVideoPlayer() {
	'use strict'
  var URL = window.URL || window.webkitURL
  var displayMessage = function (message, isError) {
	  if (isError){
		var element = document.querySelector('#message')
		element.style.display = "block";
		element.innerHTML = message;
		element.className = 'error';
	  }
  }
  var getFile = function(fileList,fileName) {
	  var ret = false;
	  Array.from(fileList).forEach(function(file){
		if (file.name == fileName){
			ret = file;
			return;
		}
	  });
	  return ret;
  }
  
  var closestChatMessage;
  
  var startTimestamp;
  
  var timeZeroPad = function(number){
	  return number<10? "0"+number.toString(): +number.toString();
  }
  
  var current_timestamp = function(videoTime){
	var timeStart = new Date("01/01/2007 " + startTimestamp);
	var timeNow = new Date("01/01/2007 " + startTimestamp);
	timeNow.setSeconds(timeNow.getSeconds() + videoTime);
	return `${timeZeroPad(timeNow.getHours())}:${timeZeroPad(timeNow.getMinutes())}:${timeZeroPad(timeNow.getSeconds())}`
  }
  
  var timeDifSeconds = function(t1,t2){
	  t1 = t1.split(":");
	  var t1s = parseInt(t1[0])*3600 + parseInt(t1[1])*60 + parseInt(t1[2]);
	  t2 = t2.split(":");
	  var t2s = parseInt(t2[0])*3600 + parseInt(t2[1])*60 + parseInt(t2[2]);
	  return t1s>t2s? t1s-t2s: t2s-t1s;
	  
  }
  
  var parseChatMessages = function(contents){
	  contents = contents.split("\n");
	  var messages = [];
	  //get messages into format
	  contents.forEach(function(message){
		  if (message.includes("\t") && message.includes("From ") && message.includes(":")){
			  var time = message.split("\t")[0];
			  var sender = message.split("From ")[1].split(":")[0];
			  var msg = message.split("From ")[1].split(":")[1];
			  message = {"time":time,"sender":sender,"content":msg};
			  messages.push(message);
		  }
	  });
	  return messages;
  }
  
  var makeChats = function(messages){
	  var chatEl = $("#chat");
	  messages.forEach(function(msg){
		  var div = $("<div class=\"msgDiv\"></div>")
		  div.attr("time",msg["time"]);
		  var sender = $("<p class=\"msgSender\"></p>")
		  sender.html(msg["sender"]);
		  var messageEl = $("<p class=\"msgContent\"></p>")
		  messageEl.html(msg["content"]);
		  var timeEl = $("<p class=\"msgTime\"></p>")
		  timeEl.html("-"+msg["time"]);
		  $(timeEl).click(function(){
			  var videoNode = document.querySelector('video')
			  var dif = timeDifSeconds(msg["time"],startTimestamp);
			  videoNode.currentTime = dif;
		  });
		  div.append(sender);
		  div.append(timeEl);
		  div.append(messageEl);
		  chatEl.append(div);
	  });
  }
  
  var addChatMessages = function(chatFile){
	  var chatEl = $("#chat");
	  var reader = new FileReader();
	  reader.onload = (function(theFile) {
        return function(e) {
			var contents = e.target.result;
			var messages = parseChatMessages(contents);
			makeChats(messages);
        };
      })(chatFile);
	  reader.readAsText(chatFile);
  }
  
  var chatResize = function(){
	 var videoNode = $(document.querySelector('video'))
	 var controls = $("#controls");
	$("#chat").height(videoNode.outerHeight(true)-controls.outerHeight(true));
	$("#chat").width($("#mainView").innerWidth()-videoNode[0].getBoundingClientRect().right);
	$("#chat").css('visibility','visible');
  }
  
  var onTimeUpdate = function(current){
	  var time = current_timestamp(current);
	  $("#currentTime").html("Time: "+time);
	  //clear highlight after 5 seconds;
	  var highlights = $(".highlight");
	  if (highlights.length>0){
		  var lastHighlight = highlights[highlights.length-1];
		  var timeH = $(lastHighlight).attr('time');
		  console.log("Hightlihg",timeH);
		  var dif = timeDifSeconds(time,timeH);
		  if (dif>5){
			 $('.highlight').removeClass('highlight');
		  }	  
	  }
	  
	  var closestTime = -1;
	  $("#chat").children('.msgDiv').each(function(idx,el){
		  el = $(el);
		  if (el.attr('time')==time){
			  console.log("match");
			  //only highlight one at a time
			  $('.highlight').removeClass('highlight');
			  el.addClass('highlight');
			  closestChatMessage = el;
			  closestTime = 0;
		  }
		  else if (closestTime==0){
			  return;
		  }
		  else{
			  var dif = timeDifSeconds(el.attr('time'),time);
			  if (closestTime<0 || dif<closestTime){
				  closestTime = dif;
				  closestChatMessage = el;
			  }
			  else return; //no longer getting closer
		  }	  
	  });
  }
  var playSelectedFile = function (event) {
	startTimestamp = this.files[0].webkitRelativePath.split(" ")[1].replaceAll(".",":").trim();
	console.log(startTimestamp);
    var file = getFile(this.files,"zoom_0.mp4")
	if (file==false) return;
	var chat = getFile(this.files,"chat.txt");
	if (chat==false) return;
    var type = file.type
    var videoNode = document.querySelector('video')
    var canPlay = videoNode.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    var message = 'Can play type "' + type + '": ' + canPlay
    var isError = canPlay === 'no'
    displayMessage(message, isError)
    if (isError) {
      return
    }

    var fileURL = URL.createObjectURL(file)
    videoNode.src = fileURL
	videoNode.addEventListener('loadeddata', function() {
		chatResize();
	}, false);
	addChatMessages(chat);
	$(videoNode).on(
    "timeupdate", 
    function(event){
      onTimeUpdate($("video")[0].currentTime);
    });
	$("#chatLineup").css('visibility','visible');
	$("#chatLineup").click(function(){
		if (closestChatMessage){
			closestChatMessage[0].scrollIntoView();
		}
	});
	$("#chatBox").css('display','inline-block');
  }
  $(window).resize(function(){
	chatResize();
  });
  $(window).keydown(function(e) {
	  var videoNode = document.querySelector('video')
	  if(e.key=="ArrowRight"){
		  videoNode.currentTime+=5;
	  }
	  else if (e.key=="ArrowLeft"){
		  videoNode.currentTime-=5;
	  }
	  else if(e.key=="ArrowUp"){
		  videoNode.playbackRate += 0.1;
		  $("#currentSpeed").html("Speed: "+parseFloat(videoNode.playbackRate).toFixed(1)+"x");
	  }
	  else if (e.key=="ArrowDown"){
		  videoNode.playbackRate -= 0.1;
		  $("#currentSpeed").html("Speed: "+parseFloat(videoNode.playbackRate).toFixed(1)+"x");
	  }
		  
	});
  var inputNode = document.querySelector('input');
  var uploadNode = document.querySelector('#upload');
  $(uploadNode).click(function(){
	 inputNode.click(); 
  });
  inputNode.addEventListener('change', playSelectedFile, false)
})()