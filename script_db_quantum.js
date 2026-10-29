require ('dotenv').config({quiet:true})

const DATABASE_URL = process.env.DATABASE_URL


const host = new URL (DATABASE_URL).host


const neonHttpEndPoint = `https://${host}/sql`

async function executarQueryNeon(querySQL, parametros)
{
    try {
        const resposta = await fetch(neonHttpEndPoint,
            {
                method:'POST',
                headers:{
                    'Neon-connectio-String': DATABASE_URL,
                    'Content-Type': 'aplication/json'
                },
                body:JSON.stringify({
                    query:querySQL,
                    params:parametros
                })
            }
        )

        if(!resposta.ok)
        {
            const erroTexto = await resposta.text()
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`)
        }
        const dados = await resposta.json()
        return dados.rows
    } catch (error) {
        console.error("Falha ao se comunicar com o banco de dados")
        return null
    }    
}



module.exports = {executarQueryNeon}