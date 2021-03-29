const logger = require("../conf/winston");
const bConst = require('./bitConst');
const objUtil = require('./objectUtil');

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
};

/**
 * Slack타이틀 생성()
 * @param {any} title 타이틀제목
 * @returns 
 */
_util.setSlackTitle = function(title){
    const symbol = ((process && process.env && process.env.targetSymbol) ? process.env.targetSymbol : '');
    const cnvttitle = ['(',symbol,')'].join('');

    if(symbol){
        return [cnvttitle, ' ', title].join('');
    }

    return title;
};

/**
 * 매수 데이터 Slack Msg 만들기
 * @param {any} buydata 매수 데이터
 * @returns 
 */
_util.setSlackMsgOfOrderBuy = function(buydata){
    let message = '';
    
    message = [
             'price(b/s): ',buydata.price, ' / ', '',
        '\n','qty: ',buydata.qty,
        '\n',' ',
        '\n','===== BUY.INFO =====',
        '\n','inAccNo: ',buydata.innerAccNo,
        '\n','cId: ',buydata.clientOrderId,
        '\n','fee: ',buydata.buyFee,
        '\n','trTime: ',_util.getFullTimeWithDelimter(buydata.transactTime),

        objUtil.objView(buydata)

    ].join('');

    return message;
};

/**
 * 매도 데이터 Slack Msg 만들기
 * @param {any} buydata  매수 데이터
 * @param {any} selldata 매도 데이터
 * @returns 
 */
_util.setSlackMsgOfOrderSell = function(buydata, selldata){
    let message = '';

    message = [ 
             'price(b/s): ',buydata.price, ' / ', selldata.sellPrice,
        '\n','qty: ',buydata.qty,
        '\n','profit($): ', selldata.profit,
        '\n','profit(%): ', selldata.profitRate,
        '\n',' ',
        '\n','===== BUY.INFO =====',
        '\n','inAccNo: ',buydata.innerAccNo,
        '\n','cId: ',buydata.clientOrderId,
        '\n','fee: ',buydata.buyFee,
        '\n','trTime: ',_util.getFullTimeWithDelimter(buydata.transactTime),
        '\n',' ',
        '\n','===== SELL.INFO =====',
        '\n','inAccNo: ',selldata.innerAccNo,
        '\n','cId: ',selldata.clientOrderId,
        '\n','fee: ',buydata.sellFee,
        '\n','trTime: ',_util.getFullTimeWithDelimter(selldata.sellTime),

    ].join('');

    return message;
}

/**
 * 시간 전체를 표시한다. YYYYMMDD.HHMMSS
 * @param {any} timestamp 타임스탬프(13자리)
 * @returns 
 */
_util.getFullTimeWithDelimter = function(timestamp){
    return [objUtil.getYYYYMMDD(timestamp) ,'.', objUtil.getHHMMSS(timestamp)].join('') ;
};

module.exports = _util;