/*
Downloading blockchain :downloadChainRequest
→
shalow checking of the blocks: callbackDownloadChain
→
downloading tweets of accunts needed: get_all_tweet
→
Deep checking of the blockchain :checkAllChain　
→　
Deciding last block:findLastBlock
→
Making new block: make_block
→
Uploading new block: uploadChainRequest
*/

var my_account_name = "";
var the_res;
var tweets_cash = {}
var all_account=[]
var json_blocks=[];
var MAX_ID = {};

//Template of a block

var block_template = {
    //block number
    "number": null,
    //the account name of who made this block 
    "owner": null,
    //the number of block which this block is added to
    "inherit": null,
    //balances and tweet id
    "scores": {"@me": ["point=1000", "last_id:12345678"]}
};
function startMining(data) {
    console.log(data);
    //eliminating locked one
    if (data.protected) {
        $("#score-board").html("<p>You are locked bustard!</p><p>Make your account public!</p>");
        return;
    }

    my_account_name = my_account_name || data.screen_name;

    //shallow cheking in 'make_candidate1' and listing up the Twitter accounts to download their timelines.
    function easyBlockChainCheck() {
        console.log("==========TRIGGER!==========")
        var defer = $.Deferred();
        var callbackDownloadChain = function (res) {
            $("#score-board").html("<p>BLOCKCHAIN DOWNLOAD</p><p>" + res + "</p>");
            json_blocks = JSON.parse(res);
            if (my_account_name == json_blocks[json_blocks.length-1].owner) {
                $("#score-board").html("<p>You?Again?</p><p>Are you gonna do51% Attack?</p>");
                defer.reject();
                return;
            }
            candidate1 = make_candidate1(json_blocks);

            for (var num in candidate1) {
                if (String(num) !== "0") {
                    console.log(num);
                    hsh = make_hash(json_blocks[num]);
                    if (all_account.indexOf(hsh) === -1) {
                        all_account.push(make_hash(json_blocks[num]));
                    }
                }
            }
            all_account.push(my_account_name+"\t"+null+"\t"+null);
            defer.resolve();
        }
        
        //Downloading blockchain→　shallow check
        $.ajax(downloadChainRequest()).then(callbackDownloadChain, callbackError);
        return defer.promise();
    }

    //result of easyBlockChainCheck is the list of Twitter accounts 'all_account'
    //collecting all tweets we need
    function collectTweetData() {
        console.log("==========TRIGGER2!==========")
        var defer = $.Deferred();
        var get_all_tweet = function (account_list,index,res){
            if(res&&res[0]){
                //cashing tweets for same search
                tweets_cash[account_list[index-1]] = res;
                MAX_ID[account_list[index-1]] = res[0]["id"];
            }else if(res!==null){
                tweets_cash[account_list[index-1]] = [];
                MAX_ID[account_list[index-1]] = parseInt(account_list[index-1].split("\t")[2]);
            }
            
            if(index>=account_list.length){
                defer.resolve();
                return;
            }
            
            var inp = account_list[index].split("\t");
            the_res.get(get_tweet_by_term(inp[0],inp[1],inp[2])).done(get_all_tweet.bind(null,account_list,index+1)).fail(callbackError);
        }
        get_all_tweet(all_account,0,null);
        return defer.promise();
    }
    easyBlockChainCheck().then(collectTweetData).then(checkAllChain, callbackError);
}

function findLastBlock(inherit,first=true){

    var result = {};
    var max = 0;

    //return the length of the chain inheriting. return 0 if 'deny' block found in chain.
    function check_chain(block_num,count){
      var next=inherit[block_num]
      if(next==block_num){return 0;
      }else if(next=="deny"){
          return 0;
      }else if(!next){return count+1}
      else{return check_chain(next,count+1)}
    }

    //ranking length of chains(by start blocks)
    for(var key in inherit){
      var num =check_chain(key,0)
      if (num>max){max=num;}
      if (result[num]){result[num].push(key)}
      else{result[num] = [key]}
    }
    console.log(result)
    //return the best.If there are a same score,return old one of that.
    return Math.min(...result[max])
}

function tweetScore(tweet_object) {
    //var favo = tweet_object.favorite_count;
    var retw = tweet_object.retweet_count;
    var score = retw;
    return score;
}

function allTweetsScore(tweets) {
    var total_score = 0;
    tweets.forEach(function (tweet) {
        var tweet_score = tweetScore(tweet);
        var is_applicable = applicable(tweet);
        if (is_applicable && tweet_score > 0) {
            total_score += tweet_score;
            output(tweet.id, tweet.text, tweet.retweet_count);
        }
    });
    return total_score;
}

function applicable(tweet_object) {
    var urls = tweet_object.entities.urls;
    var is_retweet_status = (tweet_object.retweeted_status != void 0);
    var is_quote_status = tweet_object.is_quote_status;
    if (is_retweet_status || is_quote_status) {
        //eliminating retweeting and quoting from the others
        return false;
    }
    in_external_url_status = urls.some(function (url) {
        //check this has external link
        return !(/https:\/\/twitter\.com/.test(url.expanded_url));
    });
    return in_external_url_status;
}

function output(tweet_id, tweet_text, retweet_count) {
    console.log(tweet_text)
}

function callbackError(err) {
    console.log(err);
}

//Omitted
function sendDataRequest(screen_name, tweets) {
}

function callbackReturn() {
 
}

function get_tweet_by_term(user_name, since_id, max_id) {
    var pool = [null,undefined,"null","undefined"]
    var api_url = "1.1/statuses/user_timeline.json?screen_name=";
    api_url += encodeURIComponent(user_name);
    api_url += "&count=200&";
    if(pool.indexOf(since_id)===-1){
      api_url += "&since_id=";
      api_url += since_id;
    }
    if(pool.indexOf(max_id)===-1){
      api_url += "&max_id=";
      api_url += max_id;
    }
    return api_url
}

//Last function to execute
//making a new block and uploading it
function make_block(screen_name,last_json_block) {
  var new_block;
  mypoint = last_json_block[screen_name];
  if (mypoint){
    since_id=mypoint[1];
    my_last_point = mypoint[0];
  } else {
    since_id=null;
    my_last_point=0;
  }
  var name_key = screen_name+"\t"+since_id+"\t"+null;
  var tweets = tweets_cash[name_key];
  var last_id = MAX_ID[name_key];

  recent_tweets = []
  tweets.forEach(function(tw){if(tw["id"]>since_id){recent_tweets.push(tw)}})
  var my_score = allTweetsScore(recent_tweets);

  if (Number(my_score) === 0) {
      $("#score-board").html("<p>You have no score</p><p>You cannnot make the new block</p>");
      return;
  }

  last_json_block["scores"][screen_name] = [my_score + my_last_point, last_id];
  last_json_block["inherit"] = last_json_block["number"];
  last_json_block["number"] = json_blocks[json_blocks.length-1]["number"]+1;
  last_json_block["owner"] = screen_name;

  console.log("NEW", last_json_block);
  new_block = JSON.stringify(last_json_block);
  $.ajax(uploadChainRequest(new_block)).done(function(res){
    console.log(res);
    $("#score-board").html("<p>BLOCKCHAIN DOWNLOAD</p><p>" + res + "</p>");
  });
}


//There is no case that balances changes between a block and inherit block EXCEPTING owner's one. Such a block get eliminated from the new inherit block candidates list in this function.
function check_accounts(scores1,scores2,owner){

  for (var account in scores1){
    if (account!=owner){
      if(scores1[account]!==scores2[account]){
        console.log("account miss!!!!!!!!!!!!")
        return false
      };
    }
  }
  return true
}

//making candidates of new inherit block.
function make_candidate1(json_blocks){
  var result = {};
  //check whether accounts not in changelist in inherit block is same in the new block
  function check_accounts(scores1,scores2,owner){

    for (var account in scores1){
      if (account!=owner){
        if(scores1[account][0]!==scores2[account][0]){return false};
      }
    }
    return true
  }

      
  for (var key=json_blocks.length;key>=json_blocks.length-30;key--){
    json_block = json_blocks[key];
    if (json_block) {
      inherit_block = json_blocks[json_block.inherit];
      if(check_accounts(json_block.scores,inherit_block.scores,json_block.owner)){
        result[json_block.number]=inherit_block.number
      }else{
        result[json_block.number]="deny"
      }
    }
  };
  for (var key in result){
    if(result[key]=="deny"){
      update_candidate(result,key)
    }
  }
  console.log("make_candidate1",result)
  return result
}

//Just make the candidate list strictly 
function update_candidate(candidate,number){

  if(candidate[number]!=="deny"){
    candidate[number]="deny"
    for(var num in candidate){
      if(candidate[num]==number){
        update_candidate(candidate,num)
      }
    }
  }
  return candidate
}

//check the change of Owner's balance of a block.
function check_owner_point(block){

  console.log(block.number)
  if(block.number==0){return true}
  var hash = make_hash(block)
  var tweets = tweets_cash[hash]
  var points = allTweetsScore(tweets)
  var last_point = inherit_block.scores[block.owner]
  if(last_point){last_point=last_point[0]}else{last_point=0}
  var this_point = block.scores[block.owner]
  if(this_point){this_point=this_point[0]}else{this_point=0}

  if(points>10){
    return (Math.abs(points*0.8)<=Math.abs(this_point-last_point)
          && Math.abs(this_point-last_point)<=Math.abs(points*1.2))
  }else{
    console.log("もんだい")
    console.log(points,this_point,last_point)
    return Math.abs(points)<=Math.abs(this_point-last_point)
  }
}

//TweetCashを作る時、検索アカウント+since_id+max_idをキーにして値を入れたい
function make_hash(block,inherit_block=null,user=null){
  if(user==null){
    var user = block.owner
  }
  if(inherit_block==null){
    inherit_block = json_blocks[block.inherit]
  }
  console.log(inherit_block);

  var since_id = inherit_block.scores[user]
  if(since_id){since_id = since_id[1]}else{since_id=null}
  var max_id = block.scores[user]
  if(max_id){max_id = max_id[1]}else{max_id=null}

  return user+"\t"+since_id+"\t"+max_id
}

//checking the owner's balance change of each blocks. 
function checkAllChain(){
    console.log("CANDIDATE")
    console.log(candidate1)
    for(var num in candidate1){
        var det =check_owner_point(json_blocks[num])
        if(!det){
          candidate1[num]="deny"
          $("#score-board").html("<p>" + json_blocks[num].owner + "はブロックチェーンからハズレました</p>");
        }
    }
    //here you decide last block(inherit block)
    var last_block_number = findLastBlock(candidate1)
    var last_block = json_blocks[last_block_number]
    console.log("LAST", last_block);
    //clearInterval(interval2)
    //making a block and uploading
    make_block(my_account_name, last_block);
}

function downloadChainRequest() {
    var url = 'https://059i2a5cg8.execute-api.ap-northeast-1.amazonaws.com/prod/getbalance';
    var data = {
        name: "DOWNLOAD"
    };

    return {
        type: 'GET',
        url: url,
        data: data,
        dataType: "json",
        contentType: 'application/json'
    };
}

//omitted
function uploadChainRequest(json) {
}

//Authorization
function callbackGetInfo(res) {
    var api_url = "1.1/account/verify_credentials.json";
    the_res = res;
    the_res.get(api_url).done(startMining).fail(callbackError);
}

//STARTS FROM HERE
function main() {
    OAuth.popup('twitter').done(callbackGetInfo).fail(callbackError).always(callbackReturn);
}

OAuth.initialize('PUBLIC KEY');

