// express setting
const express = require('express');

const svcObj = require('./slackService');
const logger = require('../conf/winston');

const objUtil = require('../util/objectUtil');
const jsonUtil = require('../util/jsonUtil');

module.exports = (async ()=>{
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // 서버 최초 기동시 동작시킬 서비스 정의
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    logger.debug('autoStartService processing start.');
    const jsonObj = jsonUtil.getJsonObj('autoStartService');
    const serviceName = 'slack';

    try{
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // service defined
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        logger.debug('autoStartService-'+serviceName+' processing start.');
        await svcObj.init();
        await svcObj.run();
        logger.debug('autoStartService-'+serviceName+' complete.');

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // 이후 추가할 것.
        ////////////////////////////////////////////////////////////////////////////////////////////////////
    
    }catch(e){
        svcObj.insertErrorCntn(jsonObj.getMsgJson('-1',objUtil.objView(e)));
    }
})();