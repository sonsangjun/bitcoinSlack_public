const objUtil = require('../util/objectUtil');
const logger = require('../conf/winston');
const sqlObj = require('../util/sqlUtil');
const jsonUtil = require('../util/jsonUtil');
const slackUtil = require('../util/slackUtil');

const dealSetSvc = require('./dealSetService');

const bConst = require('../util/bitConst');
const { WebClient } = require('@slack/web-api');

module.exports = (function(){
    ///////////////////////////////////////////////////////////////////
    // Init Area
    const jsonObj = jsonUtil.getJsonObj('slackService');
    const isDev = objUtil.checkDevMode();

    let slackObj = {};
    let svcObj = {};
    let isSwitchOnProcessing = false;
    let isInit = false;

    let dealSet = dealSetSvc.getDefaultSet();    

    /**
     * Slack초기화
     */
     svcObj.init = function(){
        return (new Promise(async (resolve, reject)=>{
            try{
                const result = await dealSetSvc.selectDealSetFromDBnEnv();
                isInit = true;
                dealSet = result;
                
                slackObj = new WebClient(dealSet.slack.token);

                resolve(jsonObj.getMsgJson('0','initDealSet success.'));

            }catch(err){
                logger.error('init fail. '+objUtil.objView(err));  
                reject(jsonObj.getMsgJson('-1', err));
            }
        }));
    };

    /**
     * 초기화 여부 체크
     */
     svcObj.checkInit = function(){
        return isInit;
    };

    svcObj.run = function(){
        // 이미 떠 있으면 return;
        if(isSwitchOnProcessing){
            logger.debug(alreadyMsg);
            return jsonObj.getMsgJson('-1','slack already run.');
        }

        return (new Promise((resolve, reject)=>{
            svcObj.init().then((result)=>{
                let lastSlack = Date.now();

                // 서버 시작을 알리는 Slack
                sqlObj.insertSlackHistory(slackUtil.makeSlackMsgOfSingle(bConst.SLACK.TYPE.INFO, 'Server Init','Success Start Slack Server!!'));                

                const prcsFn = function(){
                    logger.debug('======================= prcsSlack ======================= ');
                    const curMsec = Date.now();
                    const curHHMM = 'T'+objUtil.getHHMM(curMsec);
                    let slackCnt = 0;
                    let slackInterval = curMsec - lastSlack;

                    logger.debug('curHHMM :'+curHHMM+', lastSlack(mSec): '+lastSlack);

                    if(!isSwitchOnProcessing){
                        logger.debug('stop slack.');
                        return ;
                    }
                    
                    sqlObj.selectSlackCnt().then((result)=>{
                        slackCnt = (result && result.length>0 ? result[0].cnt : 0);

                        // 보내는 조건 (Slack 내용이 있을때, 정해진 주기마다 or 정해진 갯수마다.)
                        // dealSet.errMail.definedHour / dealSet.errMail.definedCnt
                        logger.debug('result : '+objUtil.objView(result));
                        logger.debug('slackCnt :'+slackCnt+', slackInterval: '+slackInterval);

                        if((slackCnt < 1)){
                            // 정해진 시간 OR 갯수를 충족하지 않는 경우. Waitting
                            setTimeout(prcsFn, dealSet.intervalTime*1000);

                        }else if((slackInterval > (dealSet.slack.intervalTime * 1000))){
                            // 정해진 시간 충족하는 경우
                            logger.debug('slack start.');
                            lastSlack = curMsec;
                            sqlObj.selectSlackHistory().then((data)=>{
                                // Slack 진행.
                                logger.debug('selectErrorHistory complete');
                                return svcObj.prcsSendingSlack(data);
                            }).then((slackIds)=>{
                                // Slack 성공 및 DB에 SendFlag수정(N->Y)
                                logger.debug('prcsSendingSlack complete. '+objUtil.objView(slackIds));
                                return sqlObj.updateSendingSlack(slackIds);
                            }).then(()=>{
                                // Slack 성공. 스케쥴링 다시 진행
                                logger.debug('slack success.');
                                setTimeout(prcsFn, dealSet.intervalTime*1000);                            
                            }).catch((err)=>{
                                // Slack 중지.
                                logger.error('slack fail. '+objUtil.objView(err));
                                svcObj.switchingOrderingFlag(false);
                                setTimeout(prcsFn, dealSet.intervalTime*1000);
                            });

                        }else{
                            // 정해진 시간 OR 갯수를 충족하지 않는 경우. Waitting
                            setTimeout(prcsFn, dealSet.intervalTime*1000);
                        }

                    }).catch((err)=>{
                        // Slack 중지.
                        logger.error('slack fail. '+objUtil.objView(err));
                        svcObj.switchingOrderingFlag(false);
                        setTimeout(prcsFn, dealSet.intervalTime*1000);
                    });
                }
        
                // Slack 시작.
                svcObj.switchingOrderingFlag(true);
                setTimeout(prcsFn, dealSet.intervalTime*1000);
        
                resolve(jsonObj.getMsgJson('0','slack success.'));
            
            }).catch((err)=>{
                // Slack에서 에러 발생시. 억지로 돌리지 않음.
                let errjson = jsonObj.getMsgJson('0',err);
                errjson.msg = errjson.msg+' | slack is stop.(set dealSet fail)';                
                logger.error(errjson.msg);
                reject(errjson);
            });
        }));
    };

    /**
     * Slack 서비스 정지
     */
    svcObj.stop = function(){
        svcObj.switchingOrderingFlag(false);
        return jsonObj.getMsgJson('0','send signal [slack service stop]');
    };

    /**
     * 에러목록에 대한 Slack 발송을 진행한다.
     * 반환값으로 발송한 slackIds를 반환한다.
     * @param {any} list Slack리스트
     */
    svcObj.prcsSendingSlack = function(list){
        logger.debug('prcsSendingSlack call. ');

        return (new Promise(async (resolve, reject)=>{
            try{
                const len = (list ? list.length : 0);

                let slackIds = [];
                let index=0;
                let obj = {};

                for(index=0; index<len; index++){
                    obj = list[index];

                    try{
                        const timestamp = Date.now();
                        const horiBar = '#########################';
                        const slackType = obj.slackType;
                        const slackTitle = obj.slackTitle;
                        const slackMsg = obj.slackMsg;
                        const slackTime = [objUtil.getYYYYMMDD(obj.slackTime),'.',objUtil.getHHMMSS(obj.slackTime)].join('');
    
                        const message = [
                            '\n',horiBar,
                            (isDev ? '\n# [DEV] ' : '\n# '), slackType,' | ',slackTime,
                            '\n# ',slackTitle,
                            '\n',' ',
                            '\n',slackMsg,
                            '\n','',
                            '\n','.'
                        ].join('');

                        let uptJson = {};
    
                        await svcObj.sendMsgInSlack(message);
                        
                        uptJson.slackId = obj.slackId;
                        uptJson.sendTime = timestamp;
                        uptJson.sendFlag = bConst.YN.Y;

                        slackIds.push(uptJson);

                    }catch(err){
                        logger.error(['slack SendError. ',objUtil.objView(err)].join(''));
                    }
                }

                resolve(slackIds);

            }catch(e){
                reject(jsonObj.getMsgJson('-1',err));
            }
        }));
    };

    /**
     * 슬랙 메시지 전송
     */
     svcObj.sendMsgInSlack = function(message){
        return (new Promise(async (resolve, reject)=>{
            try{
                if(!svcObj.checkInit()){
                    logger.error('isInit is fail. start init.');  
                    await svcObj.init();
                }

                if(!(dealSet.slack && dealSet.slack.token)){
                    return reject(jsonObj.getMsgJson('-1','slackService token is empty.'));    
                }

                const result = await slackObj.chat.postMessage({
                    text: message,
                    channel: dealSet.slack.channel,
                });
                
                resolve(result);

            }catch(err){
                logger.error('init fail. '+objUtil.objView(err));  
                reject(jsonObj.getMsgJson('-1', e));
            }
        }));
    };

    /**
     * isSwitchOnOrdering 값을 설정한다.
     * @param {any} flag boolean값
     */
    svcObj.switchingOrderingFlag = function(flag){
        isSwitchOnProcessing = flag;
    },

    /**
     * 에러내용을 테이블에 삽입.
     * @param {any} json 에러내용
     */
    svcObj.insertErrorCntn = function(json){
        if(!json){
            logger.debug(jsonObj.getMsgJson('-1','json is empty.'));
            return;
        }

        let el = {};
        el.errorMsg  = json.msg;
        el.errorTime = Date.now();
        el.sendFlag  = 'N';
        el.sendTime  = 0;

        sqlObj.insertErrorHistory([el])
        .then((res)=>logger.debug(jsonObj.getMsgJson('0','insertErrorCntn success.')))
        .catch((err)=>logger.error(jsonObj.getMsgJson('-1','insertErrorCntn fail. '+objUtil.objView(err))));
    };

    return svcObj;
})();