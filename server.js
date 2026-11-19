// Servidor da Loja do Zé
// O navegador conversa com ESTE servidor (mesma origem, então não há CORS).
// Só o servidor conversa com o Neon, e a senha do banco nunca chega ao navegador.
const http = require('http')
const fs = require('fs')
const path = require('path')
const { executarQueryNeon } = require('./script_db_quantum.js')

const PORTA = process.env.PORT || 3001

const arquivos = {
    '/': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/index.html': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/app.js': { arquivo: 'app.js', tipo: 'text/javascript; charset=utf-8' },
    '/style.css': { arquivo: 'style.css', tipo: 'text/css; charset=utf-8' }
    
}

function responderJSON(res, status, dados) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(dados))
}

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let corpo = ''
        req.on('data', pedaco => corpo += pedaco)
        req.on('end', () => {
            try { resolve(JSON.parse(corpo || '{}')) }
            catch (erro) { reject(erro) }
        })
    })
}

const servidor = http.createServer(async (req, res) => {
    // GET /api/categorias -> lista as categorias
     
    if (req.url === '/api/categorias' && req.method === 'GET') {
     
        const linhas = await executarQueryNeon('SELECT * FROM categoria ORDER BY id_categoria')
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
        return responderJSON(res, 200, linhas)
    }

    // POST /api/categorias -> cadastra uma categoria nova
    if (req.url === '/api/categorias' && req.method === 'POST') {
        let corpo
        try { corpo = await lerCorpo(req) }
        catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }

        const descricao = (corpo.descricao || '').trim()
        if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })

        const linhas = await executarQueryNeon(
            'INSERT INTO categoria (descricao) VALUES ($1) RETURNING *',
            [descricao]
        )
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao inserir no banco' })
        return responderJSON(res, 201, linhas[0])
    }

    // PUT /api/categorias/:id -> atualiza uma categoria
if (req.url.startsWith('/api/categorias/') && req.method === 'PUT') {

    const id = req.url.split('/')[3]

    let corpo
    try { corpo = await lerCorpo(req) }
    catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }

    const descricao = (corpo.descricao || '').trim()

    if (!descricao) {
        return responderJSON(res, 400, { erro: 'Informe a descrição' })
    }

    const linhas = await executarQueryNeon(
        'UPDATE categoria SET descricao = $1 WHERE id_categoria = $2 RETURNING *',
        [descricao, id]
    )

    if (linhas === null) {
        return responderJSON(res, 500, { erro: 'Falha ao atualizar no banco' })
    }

    if (linhas.length === 0) {
        return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
    }

    return responderJSON(res, 200, linhas[0])
}

// DELETE /api/categorias/:id -> exclui uma categoria
if (req.url.startsWith('/api/categorias/') && req.method === 'DELETE') {

    const id = req.url.split('/')[3]

    const linhas = await executarQueryNeon(
        'DELETE FROM categoria WHERE id_categoria = $1 RETURNING *',
        [id]
    )

    if (linhas === null) {
        return responderJSON(res, 500, { erro: 'Falha ao excluir do banco' })
    }

    if (linhas.length === 0) {
        return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
    }

    return responderJSON(res, 200, { mensagem: 'Categoria excluída com sucesso' })
}

    // Arquivos da página
    const rota = arquivos[req.url]
    if (rota) {
        res.writeHead(200, { 'Content-Type': rota.tipo })
        return fs.createReadStream(path.join(__dirname, rota.arquivo)).pipe(res)
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Página não encontrada')
})

servidor.listen(PORTA, () => {
    console.log(`Loja do Zé rodando em http://localhost:${PORTA}`)
})


// Exemplo do final do seu server.js
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}





