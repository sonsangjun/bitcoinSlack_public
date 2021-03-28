const logger = require("../conf/winston");
const bConst = require('./bitConst');

let _util = {};

/**
 * Slack메시지 규격에 맞게 DB에 넣을 수 있도록
 * 데이터를 생성한다.
 * 
 * (JSON Object Method 적용.)
 * @param {any} arr 객체
 */
_util.makeSlackMsgOfSingle = function(type, title, msg){
    return _util.makeSlackMsgOfMulti([{type : type, title : title, msg : msg}]);
};

/**
 * Slack메시지 규격에 맞게 DB에 넣을 수 있도록
 * 배열을 받아처리한다.
 * 
 * 배열안에 들어갈 내용은 
 * 
 * type  : (타입 : ERROR or INFO)
 * title : (제목)
 * msg   : (내용)
 * 
 * 세개다.
 * 
 * 해당 데이터 반환값을 Method를 이용하여 DB에 삽입하면 된다.
 * @param {any} arr Slack메시지를 보낼 배열
 * @returns 
 */
_util.makeSlackMsgOfMulti = function(arr){
    let cnvtArr = [];

    arr.forEach((obj)=>{
        let json = {};
        json.slackType = obj.type;
        json.slackTitle = obj.title;
        json.slackMsg = obj.msg;
        json.slackTime = Date.now();
        json.sendFlag = bConst.YN.N;
        json.sendTime = 0;
        json.del = 'N';

        cnvtArr.push(json);
    });

    return cnvtArr;
}

module.exports = _util;