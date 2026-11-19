async function gerenciarRequisicao(req, res) {
    // ADICIONE [0] AQUI:
    const urlLimpa = req.url.split('?')[0]

    // GET /api/categorias -> lista as categorias
    if (urlLimpa === '/api/categorias' && req.method === 'GET') {
        const linhas = await executarQueryNeon('SELECT * FROM categoria ORDER BY id_categoria')
        if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
        return responderJSON(res, 200, linhas)
    }

    // POST /api/categorias -> cadastra uma categoria nova
    if (urlLimpa === '/api/categorias' && req.method === 'POST') {
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
    if (urlLimpa.startsWith('/api/categorias/') && req.method === 'PUT') {
        const id = urlLimpa.split('/')[3]

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
    if (urlLimpa.startsWith('/api/categorias/') && req.method === 'DELETE') {
        const id = urlLimpa.split('/')[3]

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
    const rota = arquivos[urlLimpa]
    if (rota) {
        const caminhoArquivo = path.join(process.cwd(), rota.arquivo)
        if (fs.existsSync(caminhoArquivo)) {
            const conteudo = fs.readFileSync(caminhoArquivo)
            res.writeHead(200, { 'Content-Type': rota.tipo })
            return res.end(conteudo)
        }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Página não encontrada')
}
