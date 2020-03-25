const router = require('express').Router();
const admin = require('../config/firestore-config');
const Data = require('../models/metricsModel')



const dateId = new Date().setHours(12,0,0,0)

//gets that current days metrics
router.get('/:id/:days', (req, res)=>{
    const userId = req.params.id;
    const days = parseInt(req.params.days)
    let metricsArray = []
    let dates = []
    let newDate = dateId;
    for(let i = 0; i < days; i++){
        dates.push(newDate)
        newDate = newDate - (24*60*60*1000)
    }
    dates.forEach((date, index) => {
        Data.getMetrics(userId, date)
        .then(doc => {
            const metrics = doc.data();
            metricsArray.push({date, metrics})
            if (metricsArray.length === dates.length) {
                const sendMetrics =metricsArray.filter(val =>{
                    if(val.metrics){
                        return val
                    } else {
                        return null
                    }
                })
                return res.status(200).json(sendMetrics)
            } else {
                null
            }
        })
        .catch(err=>{
            console.error(err)
            res.status(500).json({message: 'failed to get your metrics'})
        })
    }) //end for loop
  
    
})

router.post('/:id', (req, res)=>{
    const {id} = req.params;
    Data.addMetrics(id, dateId, req.body)
        .then(() => {
            res.status(201).json({message: 'add those stats'})
        })
        .catch(err=>{
            console.error(err);
            return res.status(500).json({message: 'there was a problem'})
        })

})

router.put('/:id', (req, res)=>{
    const {id} = req.params;
    newData = req.body
    Data.getMetrics(id, dateId)
        .then(doc=>{
            let metrics = doc.data();
            console.log('metrics before', metrics)
            metrics = {
                cardsCorrect: metrics.cardsCorrect + newData.cardsCorrect,
                cardsIncorrect: metrics.cardsIncorrect + newData.cardsIncorrect,
                cardsStudied: metrics.cardsStudied + newData.cardsStudied
            }
            console.log('new Metrics', metrics)
            return metrics
        })
        .then((metrics)=>{
            Data.addMetrics(id, dateId, metrics)
            .then(() => {
                console.log('did it')
                return res.status(201).json({message: 'add those stats'})
            })
            .catch(err=>{
                console.error(err);
                return res.status(500).json({message: 'there was a problem'})
            })
        })
        .catch(err=>{
            console.error(err)
            res.status(500).json({message: 'woops, failed to update'})
        })

})


module.exports = router