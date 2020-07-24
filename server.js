var express = require("express");
const axios = require('axios');
const bodyParser = require('body-parser');
var FormData = require('form-data');
const cheerio = require('cheerio');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/returnScore/:applicationId', (req, res, next) =>{

  ////////// 1st step
  axios.get('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/login')
  .then((axiosRes) => {
    console.log(`Get Token Status: ${axiosRes.data.status}`)
    if(axiosRes.data.status == 200){
      var token = axiosRes.data.body
      let config = {
        headers: { Authorization: `Bearer ${token}`, 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36' }
      };
      getScore(req.params.applicationId, config);
    }else{
      res.send("Error getting token from Crossover");
    }

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })


  function getScore(id, config){

    axios.get('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/status?Id='+id, config)
    .then((axiosRes) => {
      
      if(axiosRes.data.done == true){

        console.log(axiosRes.data.done)

        if(axiosRes.data.totalSize == 4){

          console.log(axiosRes.data.totalSize)

          if(axiosRes.data.records[2].Score__c != null){

            console.log(axiosRes.data.records[2].Score__c)

            res.send(axiosRes.data.records[2].Score__c.toString());

          }else{

            res.send("Error getting CCAT Score")

          }

        }else{

          res.send("Error getting CCAT Score")

        }

      }else{
        
        res.send("Error getting CCAT Score");

      }


    })  .catch((error) => {
      console.log(error)
      res.send(error)
    })

}

});


app.get("/applyPosition", (req, res, next) => {

////////// 1st step
  axios.get('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/login')
  .then((axiosRes) => {
    console.log(`Get Token Status: ${axiosRes.data.status}`)
    if(axiosRes.data.status == 200){
      var token = axiosRes.data.body
      let config = {
        headers: { Authorization: `Bearer ${token}`, 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36' }
      };
      applyOnCrossover(config);
    }else{
      res.send("Error getting token from Crossover");
    }

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })

//////// Second step
function applyOnCrossover(config){

var anysize = 5;//the size of string 
var charset = "abcdefghijklmnopqrstuvwxyz"; //from where to create
var i=0, ret='';
while(i++<anysize)
  ret += charset.charAt(Math.random() * charset.length)
  
let domainName = ret;

let email = Math.random().toString(36).substring(2, 15)

console.log(email + "@" + domainName + ".com")

      var person = 
      { inputs:
          [
              {
                  iVarB_OptedOut:true,
                  iVarT_Country:"us",
                  iVarT_Email:`${email}@${domainName}.com`,
                  iVarT_FirstName:email,
                  iVarT_LastName:domainName,
                  iVarT_LeadSource:"Available Jobs",
                  iVarT_LeadSourceRaw:"utm_campaign=Available%20Jobs",
                  iVarT_LeadSourceTerm:"",
                  iVarT_Phone:"+1 201 555-0000",
                  iVarT_ProductCode:"3073",
                  iVarT_TimeZone:"America/New_York",
                  iVarT_Website:null
              }
          ]
      }

      axios.post('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/apply', person, config)
      .then((axiosRes) => {
        console.log(`Apply on Crossover Status: ${axiosRes.status}`)
        //console.log(axiosRes.data)
        //res.send(axiosRes.data)

        console.log(axiosRes.data[0].outputValues.oVarB_GuardCanApply)

        if(axiosRes.data[0].outputValues.oVarB_GuardCanApply == true){
            var applicationId = axiosRes.data[0].outputValues.oVarR_Application.Id;
            var candidateId = axiosRes.data[0].outputValues.oVarR_Candidate.Id;
            var personId = axiosRes.data[0].outputValues.oVarR_Candidate.PersonContactId;

            console.log("ApplicationId: " + applicationId)
            console.log("CandidateId: " + candidateId)
            console.log("personId: " + personId)
            
            getLinkSurvey(0, applicationId, config)



        }else{
            res.send("Error while request application in Crossover");
        }

        


      })
      .catch((error) => {
        console.log(error)
        res.send(error)
      })

}


/////// Third Step
function getLinkSurvey(surveyNumber, applicationId, config){

  axios.get('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/status?Id='+applicationId, config)
  .then((axiosRes) => {
   
    if(axiosRes.data.done == true){

      if(surveyNumber == 0){
        var testUrl = axiosRes.data.records[surveyNumber].Assessment_URL__c;
        console.log("First SURVEY: "+ testUrl)
        answerFirstSurvey( testUrl, applicationId, config);
      }else if(surveyNumber == 1){
        if(axiosRes.data.totalSize == 2){
          var testUrl = axiosRes.data.records[surveyNumber].Assessment_URL__c;
          console.log("Second SURVEY: "+ testUrl)
          answerSecondSurvey(testUrl, applicationId, config);
        }else{
          console.log("1 segundo foi pouco ao responder a PRIMEIRA questao")
          setTimeout(getLinkSurvey, 1000, 1, applicationId, config);
        }

      }else if(surveyNumber == 2){
        if(axiosRes.data.totalSize == 3){
          var testUrl = axiosRes.data.records[surveyNumber].Id;
          console.log("CCAT Survey ID: "+ testUrl)
          getCCATLink(testUrl, config)
        }else{
          console.log("1 segundo foi pouco ao responder a SEGUNDA questao")
          setTimeout(getLinkSurvey, 1000, 2, applicationId, config);
        }
        
      }

    }else{
      res.send("Error getting survey link");
    }

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })

}

/////// Fourth Step
function answerFirstSurvey(testUrl, applicationId, config){


  axios.get(testUrl)
  .then((axiosGetRes) => {

    const $ = cheerio.load(axiosGetRes.data)

    let survey_data = $('#survey_data')[0].attribs.value

    console.log(survey_data)

    var bodyFormData = new FormData();

    let timestampNow = new Date().getTime();
  
    console.log(timestampNow)
  
    let timestampFuture = timestampNow + 10000 +  Math.floor(Math.random() * 10000)
  
    let timestampDiff = timestampFuture - timestampNow

    bodyFormData.append('495851366', '3279194025');
    bodyFormData.append('495851368', '3279194030');
    bodyFormData.append('495851369', '3279194035');
    bodyFormData.append('495851370', '3279194040');
    bodyFormData.append('survey_data', survey_data);
    bodyFormData.append('response_quality_data', `{"question_info":{"qid_495851366":{"number":1,"type":"single_choice_vertical","option_count":2,"has_other":false,"other_selected":null,"relative_position":[[0,0]],"dimensions":[2,1],"input_method":null,"is_hybrid":false},"qid_495851368":{"number":2,"type":"single_choice_vertical","option_count":2,"has_other":false,"other_selected":null,"relative_position":[[0,0]],"dimensions":[2,1],"input_method":null,"is_hybrid":false},"qid_495851369":{"number":3,"type":"single_choice_vertical","option_count":2,"has_other":false,"other_selected":null,"relative_position":[[0,0]],"dimensions":[2,1],"input_method":null,"is_hybrid":false},"qid_495851370":{"number":4,"type":"single_choice_vertical","option_count":2,"has_other":false,"other_selected":null,"relative_position":[[0,0]],"dimensions":[2,1],"input_method":null,"is_hybrid":false}},"start_time":${timestampNow},"end_time":${timestampFuture},"time_spent":${timestampDiff},"previous_clicked":false,"has_backtracked":false,"bi_voice":{}}`);
    bodyFormData.append('is_previous', 'false');
    bodyFormData.append('disable_survey_buttons_on_submit', '');
  
    const headers = {
      headers: { 'Content-Type': `multipart/form-data; boundary=${bodyFormData._boundary}`,
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
      }
    }
  
  
    axios.post(testUrl, bodyFormData, headers)
    .then((axiosRes) => {
  
      console.log(axiosRes.data.substring(1,10))
  
      getLinkSurvey( 1, applicationId, config);
  
    })
    .catch((error) => {
      console.log(error)
      res.send(error)
    })

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })



}

////// fifth step
function answerSecondSurvey(testUrl, applicationId, config){

  axios.get(testUrl)
  .then((axiosGetRes) => {

    function addDays(date, days) {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    
    function returnOnlyDate(dateObj){
    
      let month = String(dateObj.getMonth() + 1).padStart(2, '0');
      let day = String(dateObj.getDate()).padStart(2, '0');
      let year = dateObj.getFullYear();
      let output = month  + '/'+ day  + '/' + year;

      //let finalDate = addDays(output, 14);

      return output;
    
    }

    const $ = cheerio.load(axiosGetRes.data)

    let survey_data = $('#survey_data')[0].attribs.value


    var dateObj = new Date(); 
    
    let addedDate = addDays(dateObj, 14);
    
    let addedOnlyDate = returnOnlyDate(addedDate);

    let linkedinProfile = "https://www.linkedin.com/in/" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    var bodyFormData = new FormData();

    let timestampNow = new Date().getTime();

    console.log(timestampNow)

    let timestampFuture = timestampNow + 10000 +  Math.floor(Math.random() * 10000)

    let timestampDiff = timestampFuture - timestampNow

    bodyFormData.append('284531480_1910291314_DMY', addedOnlyDate);
    bodyFormData.append('284533734', linkedinProfile);
    bodyFormData.append('survey_data', '4FoTYerhlqpl9PSGmuD5IWGwz2eHEG4m5wl0xt_2BSf1UuEU2MYsh30vyc_2BITBkVbQifkQyNg14RwncMpKeO234qX2rGXlWrKFpBVMfvpxpRmTgBQHE1qCKfIoU6CXdtnkEKmSNDWn6jblMbl0E2mskIrdP3OyDPNuiSeDbxIdfFR05rIAb98YJ3NxTinAtAp6kL4K6WIhc3Y2GQ9DiD9Dd0uhK3RFoQJ_2FLKDFYDP9E7mWbl19_2BNC7ncgSrd0ORDgYaSV8E88OWucRMDD_2BghIlIqGQq3IyOR8fgnQIK9HD_2FoNz73v_2FbfvGuYViQY64GyVTbhVyK8pueKf2rkEqT5_2Bl577esOwphv7reuBHV_2B876aKnSg5EWiZGgwYhg3a3GVw_2Bg69GWsqJAKrXPb4TP7O7ztDI_2FvrQLvl9nwciNrBxHgfnfoH6L_2F8L9gx24iv415H3Sh_2FHdQkJiM_2FmCoLrUMqVb5FBHJRE3N6dWA3Du5tTxFIvfhV9JJGjTTjjP9vcPiBjI_2BRO6c18f8XwaqIyKwdoiw_3D_3D');
    bodyFormData.append('response_quality_data', `{"question_info":{"qid_284531480":{"number":1,"type":"datetime","option_count":null,"has_other":false,"other_selected":null,"relative_position":null,"dimensions":null,"input_method":null,"is_hybrid":false},"qid_284533734":{"number":2,"type":"open_ended","option_count":null,"has_other":false,"other_selected":null,"relative_position":null,"dimensions":null,"input_method":"text_typed","is_hybrid":true}},"start_time":${timestampNow},"end_time":${timestampFuture},"time_spent":${timestampDiff},"previous_clicked":false,"has_backtracked":false,"bi_voice":{}}`);
    bodyFormData.append('is_previous', 'false');

    const headers = {
      headers: { 'Content-Type': `multipart/form-data; boundary=${bodyFormData._boundary}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
      }
    }


    axios.post(testUrl, bodyFormData, headers)
    .then((axiosRes) => {

      console.log(axiosRes.data.substring(1,10))

      getLinkSurvey( 2, applicationId, config);

    })
    .catch((error) => {
      console.log(error)
      res.send(error)
    })

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })
  


}


function getCCATLink(id, config){

  let obj = {}

  axios.post('https://lr58e2fcx7.execute-api.us-east-1.amazonaws.com/Prod/assessment-results/'+id+'/get-url', obj, config)
  .then((axiosRes) => {
    console.log(`Apply on Crossover Status: ${axiosRes.status}`)
    //console.log(axiosRes.data)
    //res.send(axiosRes.data)

    if(axiosRes.data.assessmentSessionUrl){
      
      console.log(axiosRes.data.assessmentSessionUrl)
      res.send(axiosRes.data.assessmentSessionUrl);

    }else{

      res.send("Error while getting CCAT link");

    }

  })
  .catch((error) => {
    console.log(error)
    res.send(error)
  })

}


});


app.listen(3000, () => {
 console.log("Server running on port 3000");
});