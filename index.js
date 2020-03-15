require("dotenv").config()
const Telegraf = require("telegraf")
const Markup = require("telegraf/markup")
const Extra = require("telegraf/extra")

const session = require("telegraf/session")
const Stage = require("telegraf/stage")
const Scene = require("telegraf/scenes/base")
const { leave } = Stage
const WizardScene = require("telegraf/scenes/wizard")

const scene = new WizardScene(
  "CONTACT_DATA_WIZARD_SCENE_ID", // first argument is Scene_ID, same as for BaseScene
  ctx => {
    ctx.reply(
      "Scrivi il nome del film. Sono intelligente, non devi essere preciso"
    )
    ctx.wizard.state.movieTitle = {}
    return ctx.wizard.next()
  },
  async ctx => {
    // validation example
    if (ctx.message.text.length < 1) {
      ctx.reply("Riprova con un titolo valido")
      return
    }
    ctx.wizard.state.movieTitle = ctx.message.text
    let title = ctx.wizard.state.movieTitle.replace(/ /g, "+")
    // console.log(title)

    // await mySendContactDataMomentBeforeErase(ctx.wizard.state.contactData)
    let url =
      "http://www.omdbapi.com/?apikey=" +
      process.env.OMDB_apikey +
      "&t=" +
      title

    // console.log(url)

    await axios
      .get(url)
      .then(body => {
        if (body.Response == "False") {
          ctx.reply("Film non trovato.")
          return ctx.scene.leave()
        }

        //   console.log(body)
        let posterUrl =
          body.data.Poster != "N/A"
            ? body.data.Poster
            : "https://lightning.od-cdn.com/static/img/no-cover_en_US.a8920a302274ea37cfaecb7cf318890e.jpg"

        if (body.data.imdbRating != "N/A") {
          ctx.replyWithPhoto(
            { url: posterUrl },
            { caption: body.data.Title + "\nScore:" + body.data.imdbRating }
          )
        } else {
          ctx.replyWithPhoto(
            { url: posterUrl },
            {
              caption:
                body.data.Title + "\nPurtroppo questo film non ha uno score."
            }
          )
        }
      })
      .catch(error => {
        console.log(error)
        return ctx.scene.leave()
      })
    return ctx.scene.leave()
  }
)
const stage = new Stage([scene])

// Utils
const TelegrafInlineMenu = require("telegraf-inline-menu")
const axios = require("axios")
const PORT = process.env.PORT || 3000

const http = require("http")
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("Esempio server HTTP\n")
})

const callback = () => {
  const address = server.address().address
  const port = server.address().port
  console.log(`
  Server avviato all'indirizzo http://${address}:${port}
  `)
}

server.listen(PORT, callback)

////////////////////////////////////////////////////////////

let welcomeMessage =
  "questo bot permette di trovare agilmente lo score IMDb di un mucchio di film!"

////////////////////////////////////////////////////////////

const welcomeMenu = new TelegrafInlineMenu(
  ctx => `Benvenuto ${ctx.from.first_name}, ${welcomeMessage}`
)
welcomeMenu.simpleButton("Cerca per titolo 🔍", "a", {
  doFunc: ctx => ctx.scene.enter("CONTACT_DATA_WIZARD_SCENE_ID")
})

welcomeMenu.setCommand("start")

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())
bot.use(stage.middleware())
bot.use(welcomeMenu.init())
// bot.start(ctx => ctx.reply("Welcome"))
bot.help(ctx => ctx.reply("TODO"))
// bot.on("sticker", ctx => ctx.reply("👍"))
// bot.hears("hi", ctx => ctx.reply("Hey there"))
// bot.hears("scene", ctx => ctx.scene.enter("CONTACT_DATA_WIZARD_SCENE_ID"))
bot.launch()
