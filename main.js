//load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const fetch = require('node-fetch')
const withQuery = require('with-query').default

//configure PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//ENDPOINT
const ENDPOINT = "https://newsapi.org/v2/top-headlines"

//API_KEY
const API_KEY = process.env.API_KEY || '537fbab1ee9c41d6b66bc08366af9a8b'

//create express instance
const app = express()

//set up handlebars
app.engine('hbs', 
    handlebars({defaultLayout: 'default.hbs'})
)

app.set('view engine', 'hbs')

//log request
app.use(
    (req, resp, next) => {
        console.info(`${new Date()}: ${req.method} ${req.originalUrl}`)
        next();
    }
)
const headers = {
    'X-Api-Key': API_KEY
}

const searchResult = []
const caches = []

//configure express
app.use(express.static(__dirname + '/public'))

app.get('/', 
    (req, resp) => {
        resp.status(200)
        resp.type('text/html')
        resp.render('search')
})

app.post('/results',
    express.urlencoded({extended: true}),
    async (req, resp) => {
        //const searchResult = []
        const search = req.body.keyword
        const country = req.body.country
        const category = req.body.category

        //check if req.body is in caches
        // if not in, put into caches and fetch the url and add data into searchResults array
        if(!JSON.stringify(caches).includes(JSON.stringify(req.body))){
            caches.push(req.body)
        
            console.info('cache',caches)

            const url = withQuery(ENDPOINT, 
                {
                    country: country,
                    //apiKey: API_KEY,
                    q: search,
                    category: category,
                    pageSize: 10
                })
            
            const result = await fetch(url, {headers})
            const data = await result.json()
            
            data.articles.map(
                d => { //using push instead of return so that the data is stacked in searchResult
                    searchResult.push({title: d.title, imgUrl: d.urlToImage, summary: d.description, publish: d.publishedAt, resultUrl: d.url, 
                    search: req.body})
                }
            )
        }
        console.info('searchResult',searchResult)

        const showResult = searchResult
        .filter( //filter out d.search != req.body
            d => {
                return JSON.stringify(d.search) == JSON.stringify(req.body)
            })
        .map(
            d => {
                return {title: d.title, imgUrl: d.imgUrl, summary: d.summary, publish: d.publish, resultUrl: d.resultUrl}
            }
        )

        console.info('showresult', showResult)
         
        resp.status(201)
        resp.type('text/html')
        resp.render('results',{
                search,
                category,
                showResult
        })
    }
)

//start express if API_KEY present
if (API_KEY){
    app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`)
    console.info(`With API_KEY ${API_KEY}`)
    })
}
else {
    console.error('API_KEY is not set')
}