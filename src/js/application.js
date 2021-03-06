
 // global variables
var client, appId, memberId,loginStatus, notification;

function setAppIDContext(appId_){
  appId = appId_;
  gadgets.window.setTitle("Gamification Manager Application - " + appId);;
  sendIntentRefreshAppId(appId);

}

var init = function() {
  var iwcCallback = function(intent) {
    if(intent.action == "FETCH_APPID"){
      sendIntentFetchAppIdCallback(appId,intent.data);
    }
    // if(intent.action == "FETCH_LOGIN"){
    //   sendIntentFetchLoginCallback(statusLogin,oidc_userinfo,intent.data);
    // }
  };
  client = new Las2peerWidgetLibrary("<%= grunt.config('endPointServiceURL') %>", iwcCallback);
  notification = new gadgets.MiniMessage("GAMEAPP");
  checkAndRegisterUserAgent();

  $('button#refreshbutton').off('click');
  $('button#refreshbutton').on('click', function() {
    getApplicationsData();
  });


// Handler when the form in "Create New App" is submitted
      // App ID will be retrieved from the service and will be put on the id attribute in class maincontent
  $("form#createnewappform").off();
  $("form#createnewappform").submit(function(e){
    //disable the default form submission
    e.preventDefault();
    var formData = new FormData($(this)[0]);
    client.sendRequest(
      "POST",
      "gamification/applications/data",
      formData,
      false,
      {},
      function(data, type){
        console.log(data);
        var selectedAppId = $("#createnewapp_appid").val();
        // setAppIDContext(selectedAppId);
        $("#createnewapp").modal('toggle');
        miniMessageAlert(notification,"New application "+ selectedAppId +" is added !", "success");
        reloadActiveTab();
        getApplicationsData();
        return false;
      },
      function(error) {
        miniMessageAlert(notification,"Failed to create new application : "+ selectedAppId +" !", "danger");
      }
    );
    return false;
  });
}



function signInCallback(result) {
    if(result === "success"){
      loginStatus = 200;
      memberId = oidc_userinfo.preferred_username;
      console.log(oidc_userinfo);
      // Change Login button to Refresh button
      $('button#refreshbutton').html("<span class=\" glyphicon glyphicon-refresh\">");
      init();
    } else {
      loginStatus = 401;
      console.log(result);
      console.log(window.localStorage["access_token"]);
    }
    if(result === "success"){
      $("#login-text").find("h4").html("Welcome " + memberId + "!");
    } else {
      $("#login-text").find("h4").html("You are not authenticated, try to login using Open ID Learning Layers.");
    }
}

function checkAndRegisterUserAgent(){
  client.sendRequest("POST",
        "gamification/applications/validation",
        "",
        "application/json",
        {},
        function(data,type){
        getApplicationsData();
        sendIntentLogin();
      },
        function(error) {
              $('#appselection').before('<div class="alert alert-danger">Error connecting web services</div>');
          }
      );
}


$(document).ready(function() {
  $('button#refreshbutton').off('click');
  $('button#refreshbutton').on('click', function() {
      $("#login-text").find("h4").html("Logging in...");
    learningLayerLogin();
  });
});

var applicationListener = function(){
  $("table#list_global_apps_table").find(".bglobappclass").off("click");
  $("table#list_global_apps_table").find(".bglobappclass").on("click", function(event){
    //Get Value in appidid
    var selectedAppId =  $(event.target).parent().parent().find("td#appidid")[0].textContent;
    console.log(selectedAppId);
    $('#alertglobalapp_text').text('Are you sure you want to open ' + selectedAppId +"?. You will be registered to selected application.");
    $('#alertglobalapp').find('button').attr('id',selectedAppId);
    $("#alertglobalapp").modal('show');
  });

  $('#alertglobalapp').find('button.btn').off('click');
  $('#alertglobalapp').find('button.btn').on('click', function(event) {
    var currentAppId = $(this).attr('id');
    $("#alertglobalapp").modal('hide');

    addMemberToApp(currentAppId,memberId);

  });

  function addMemberToApp(currentAppId,memberId){
    // add member to app
    client.sendRequest("POST",
      "gamification/applications/data/"+currentAppId+"/"+memberId,
      "",
      "application/json",
      {},
      function(data,type){
        console.log(data);

        //setAppIDContext(currentAppId);
        miniMessageAlert(notification,memberId + " is added to "+ currentAppId, "success");
        getApplicationsData();

      },
      function(error) {
           // Notification failed to add member to app
          miniMessageAlert(notification,"Failed to add " + memberId + " to "+ currentAppId, "danger");
          console.log(error);
        }
    );
  }
  $("table#list_registered_apps_table").find(".bregappclass").off("click");
  $("table#list_registered_apps_table").find(".bregappclass").on("click", function(event){
    var selectedAppId =  $(event.target).parent().parent().find("td#appidid")[0].textContent;

    $('#alertregisteredapp_text').text('Are you sure you want to open ' + selectedAppId +"?");
    $('#alertregisteredapp').find('button').attr('id',selectedAppId);
    $("#alertregisteredapp").modal('show');
  });

  $('#alertregisteredapp').find('button.btn').off('click');
  $('#alertregisteredapp').find('button.btn').on('click', function(event) {
    console.log("CLICK");
    var currentAppId = $(this).attr('id');

    setAppIDContext(currentAppId);
    $("#alertregisteredapp").modal('hide');
  });

};

function getApplicationsData(){
  client.sendRequest("GET",
      "gamification/applications/list/separated",
      "",
      "application/json",
      {},
      function(data,type){

        console.log(data);
        //Global apps
        $("#globalappstbody").empty();
        for(var i = 0; i < data[0].length; i++){
          var appData = data[0][i];
          var newRow = "<tr><td class='text-center'>" + "<button type='button' class='btn btn-xs btn-success bglobappclass'>Register</button></td> ";
          newRow += "<td id='appidid'>" + appData.id + "</td>";
          newRow += "<td id='appdescid'>" + appData.description + "</td>";
        newRow += "<td id='appcommtypeid'>" + appData.commType + "</td>";

          $("#list_global_apps_table tbody").append(newRow);
        }

        //User apps
        $("#registeredappstbody").empty();
        for(var i = 0; i < data[1].length; i++){
          var appData = data[1][i];
          var newRow = "<tr><td class='text-center'>" + "<button type='button' class='btn btn-xs btn-success bregappclass'>Select</button></td> ";
          newRow += "<td id='appidid'>" + appData.id + "</td>";
          newRow += "<td id='appdescid'>" + appData.description + "</td>";
        newRow += "<td id='appcommtypeid'>" + appData.commType + "</td>";
        newRow += "<td><button type='button' onclick='removeApplicationHandler(this)' data-dismiss='modal' data-toggle='modal' data-target='#alertremoveapp' class='btn btn-xs btn-danger '>Remove</button></td>";
        newRow += "<td><button type='button' onclick='deleteApplicationHandler(this)' data-dismiss='modal' data-toggle='modal' data-target='#alertdeleteapp' class='btn btn-xs btn-danger '>Delete</button></td>";

          $("#list_registered_apps_table tbody").append(newRow);
        }

        applicationListener();

      },
      function(error) {
            // Notification failed to get application data
      console.log(error);
       }
    );

}

var useAuthentication = function(rurl){
    if(rurl.indexOf("\?") > 0){
      rurl += "&access_token=" + window.localStorage["access_token"];
    } else {
      rurl += "?access_token=" + window.localStorage["access_token"];
    }
    return rurl;
  }






function removeApplicationHandler(element){
  var selectedappid =  $(element).parent().parent().find("td#appidid")[0].textContent;
  $('#alertremoveapp').find('button.btn').attr('id',selectedappid);
  $('#alertremoveapp_text').text('Are you sure you want to remove ' + selectedappid +"?");
}
function deleteApplicationHandler(element){
  var selectedappid =  $(element).parent().parent().find("td#appidid")[0].textContent;
  $('#alertdeleteapp').find('button.btn').attr('id',selectedappid);
  $('#alertdeleteapp_text').text('Are you sure you want to delete ' + selectedappid +"?");
}

function removeApplicationAlertHandler(){
  console.log('clicked');
  //currentAppId = window.localStorage["appid"];
  var selectedappid = $('#alertremoveapp').find('button.btn').attr('id');
  var currentAppId = appId;
  client.sendRequest("DELETE",
      "gamification/applications/data/"+selectedappid+"/"+memberId,
      "",
      "application/json",
      {},
      function(data,type){
        // opened app is the selected app
        if(selectedappid == currentAppId){
          //window.localStorage.removeItem("appid");
          setAppIDContext("");
          getApplicationsData();
        }
        else{
          getApplicationsData();
        }
        console.log(data);
      },
      function(error) {
           // Notification failed to remove app from member
            miniMessageAlert(notification,"Failed to remove member fron application. " + error, "danger");
        }
    );

  $("#alertremoveapp").modal('toggle');
}


function deleteApplicationAlertHandler(){
  console.log('clicked');
  //currentAppId = window.localStorage["appid"];
  var currentAppId = appId;
  var selectedappid = $('#alertdeleteapp').find('button.btn').attr('id');
  client.sendRequest("DELETE",
      "gamification/applications/data/"+selectedappid,
      "",
      "application/json",
      {},
      function(data,type){
        // opened app is the selected app
        if(selectedappid == currentAppId){
          //window.localStorage.removeItem("appid");
          setAppIDContext("");
        // Notification delete success
        }
        getApplicationsData();

        console.log(data);
      },
      function(error) {
            // Notification delete failed
            miniMessageAlert(notification,"Failed to delete application. " + error, "danger");
        }
    );

  $("#alertdeleteapp").modal('toggle');
}



function reloadActiveTab(){
  //reload active tab
  var $link = $('li a[data-toggle="tab"]');
    $link.parent().removeClass('active');
    var tabLink = $link.attr('href');
    $('#applicationtab a[href="' + tabLink + '"]').tab('show');
}

function sendIntentRefreshAppId(appId){
  client.sendIntent(
    "REFRESH_APPID",
    appId
  );
}

function sendIntentFetchAppIdCallback(appId,receiver){
  var dataObj = {
      appId: appId,
      status: loginStatus,
      member: oidc_userinfo,
      receiver: receiver
    };
    console.log(JSON.stringify(dataObj));
  client.sendIntent(
    "FETCH_APPID_CALLBACK",
    JSON.stringify(dataObj)
  );
}

// function sendIntentFetchLoginCallback(loginStatus,oidc_userinfo,receiver){
//   var dataObj = {
//         status: loginStatus,
//         member: oidc_userinfo,
//       receiver: receiver
//     };
//     console.log(JSON.stringify(dataObj));
//   client.sendIntent(
//     "FETCH_LOGIN_CALLBACK",
//     JSON.stringify(dataObj)
//   );
// }

function sendIntentLogin(){
  var dataObj = {
      status: loginStatus,
      member: oidc_userinfo
    };
    console.log(JSON.stringify(dataObj));
  client.sendIntent(
    "LOGIN",
    JSON.stringify(dataObj)
  );
}
