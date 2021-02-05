const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_User(agent)
{
  const acct_num = agent.parameters.acct_num;
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("BroadBand").collection("BroadBand").findOne({ mobile_num : acct_num });
  
  if(snap==null){
	  await agent.add("Re-Enter your account number");

  }
  else
  {
  user_name=snap.username;
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("BroadBand");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,date:time_date,troubleTicket:trouble_ticket };

    dbo.collection("trouble_record").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}
// trying to get status of trouble ticket
async function get_Status(agent){
    const ticket=agent.parameters.ticket;
    var username;
    var status;
    //var dbo = db.db("BroadBand");
    const s1 = await client.db("BroadBand").collection("trouble_record").findOne({troubleTicket:ticket});
    if(s1==null){
      await agent.add("re-enter yout trouble ticket number");
    }
    else{
      username=s1.username;
      status=s1.status
      await agent.add(" Username: "+username+", status: "+status);
    }
}
//trying to load rich response
function custom_payload(agent)
{
  const issue=agent.parameters.issue;
  if(issue=="status"){
      agent.add("Enter your trouble ticket number");
  }
  else{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}
}



var intentMap = new Map();
intentMap.set("ServiceIntent", identify_User);
intentMap.set("ServiceIntent - custom - custom", report_issue);
intentMap.set("ServiceIntent - custom", custom_payload);
intentMap.set("ServiceIntent - custom - custom-2", get_Status);
agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);
