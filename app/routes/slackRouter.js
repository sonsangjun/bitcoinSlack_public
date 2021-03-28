// express setting
const express = require('express');
const router = express.Router();

const logger = require('../conf/winston');
const svcObj = require('../service/slackService');
const jsonUtil = require('../util/jsonUtil');

module.exports = router;
////////////////////////////////////////////////////////////////////////////////////////////////////
// Router

// jsonMsg 초기화
const jsonObj = jsonUtil.getJsonObj('slackRouter');

/**
 * 메일링 시작.
 */
router.get('/run', function(req, res, next) {
    
    logger.info('slack run.');
    svcObj.run()
    .then((json)=>res.send(json))
    .catch((err)=>res.send(jsonObj.getMsgJson('-1',err)));
});

router.get('/stop', function(req, res, next) {
    
    logger.info('slack stop.');
    res.send(svcObj.stop());
});