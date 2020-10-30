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
const API_KEY = process.env.API_KEY || ''

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
        const showResult = []

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
            
            //searchResult = data.articles
            for (let d of data.articles){//"in" results in 0, 1, 2 | "of" results in the content of array
                const title = d['title'] //if no title, d['title] results in null, d.title results in error
                const imgUrl = d['urlToImage']
                const summary = d['description']
                const publish = d['publishedAt']
                const resultUrl = d['url']
                searchResult.push({title, imgUrl, summary, publish, resultUrl, search, country, category})
            }
        }
        
        for(let each in searchResult){
            if(searchResult[each].search == search && searchResult[each].country == country && searchResult[each].category == category){
                showResult.push(searchResult[each])
            } 
        }
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