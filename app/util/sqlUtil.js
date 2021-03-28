const bConst = require('../util/bitConst');
const obj2Str = require('./objectUtil');
const logger = require('../conf/winston');
const mysql = require('mysql');
const connection = require('./sqldb/sqlConnector');

let sqlObj = {};

(function(){
    sqlObj.connect = function(){
        connection.connect();
    };
    ////////////////////////////////////////////////////////////
    // Promise
    /**
     * 반환값 꼴
     * err null (에러나봐야 알 것 같다.)
     * 
     * result OkPacket {
     * fieldCount: 0,
     * affectedRows: 1,
     * insertId: 0,
     * serverStatus: 2,
     * warningCount: 0,
     * message: '',
     * protocol41: true,
     * changedRows: 0 
     * }
     * @param {any} query 쿼리문
     * @param {any} values insert시 값
     */
    function queryPromise(query, values){
        const promise = new Promise(
            (resolve, reject)=>{
                if(query && values && values.length > 0){
                    logger.info('queryPromise ==> query OK, values OK');
                    connection.query(query,values, function(err, result){
                        if(err){
                            logger.info('err');
                            logger.info(err);
                            return reject(err);
                        }
    
                        return resolve(result);
                    });

                }else{
                    logger.info('queryPromise ==> query OK');
                    connection.query(query, function(err, result){
                        if(err){
                            return reject(err);
                        }
    
                        return resolve(result);
                    });
                }
            }
        );

        return promise;
    }

    ////////////////////////////////////////////////////////////
    // Select
    sqlObj.selectSlackHistory = function(){
        let queryStr = 'select * from slack_history where del="N" and sendFlag="N" '

        logger.info('[selectSlackHistory] query : '+queryStr);

        return queryPromise(queryStr);
    };

    sqlObj.selectSlackCnt = function(){
        let queryStr = 'select count(*) cnt from slack_history where del="N" and sendFlag="N" '

        logger.info('[selectSlackCnt] query : '+queryStr);

        return queryPromise(queryStr);
    };

    sqlObj.selectDealSetting = function(symbol){
        let queryStr = 'select * from deal_settings where del="N" and symbol="'+symbol+'";'

        logger.info('[selectDealSetting] query : '+queryStr);

        return queryPromise(queryStr);
    };

    ////////////////////////////////////////////////////////////
    // Insert
    sqlObj.insertErrorHistory = function(arr){
        const queryStr = 'INSERT INTO error_history (errorMsg ,errorTime ,sendFlag ,sendTime ,del ) VALUES (?);';
        let values = [];

        logger.info('[insertErrorHistory] query : '+queryStr);
        
        if(arr && arr.length > 0){
            arr.forEach(el => {
                const value = [
                    el.errorMsg 
                    ,el.errorTime 
                    ,el.sendFlag 
                    ,el.sendTime 
                    ,'N'
                ];
                values.push(value);
            });

        }

        logger.debug('values ==> \n'+obj2Str.objView(values));
        return queryPromise(queryStr, values);
    };

    sqlObj.insertSlackHistory = function(arr){
        const queryStr = 'INSERT INTO slack_history (slackType, slackTitle, slackMsg, slackTime, sendFlag, sendTime, del ) VALUES (?);';
        let values = [];

        logger.info('[insertErrorHistory] query : '+queryStr);
        
        if(arr && arr.length > 0){
            arr.forEach(el => {
                const value = [
                     el.slackType
                    ,el.slackTitle
                    ,el.slackMsg
                    ,el.slackTime
                    ,el.sendFlag 
                    ,el.sendTime 
                    ,'N'
                ];
                values.push(value);
            });

        }

        logger.debug('values ==> \n'+obj2Str.objView(values));
        return queryPromise(queryStr, values);
    };

    ////////////////////////////////////////////////////////////
    // Update
    sqlObj.updateSendingSlack = function(arr){
        let queryStr = 'UPDATE slack_history SET ';
        let whereIn = [];
        let values = [];

        if(arr && arr.length > 0){
            const sendFlag = arr[0].sendFlag;
            const sendTime = arr[0].sendTime;

            queryStr += (' sendFlag="'+sendFlag+'"');
            queryStr += (',sendTime="'+sendTime+'"');
            queryStr += (' WHERE slackId IN (?) ');

            arr.forEach(el => {
                whereIn.push(el.slackId);
            });

            values.push(whereIn);
        }

        logger.info('[updateSendingSlack] query : '+queryStr);
        logger.debug('values ==> \n'+obj2Str.objView(values));
        return queryPromise(queryStr, values);
    }

})();

module.exports = sqlObj;