import express from 'express'
import db from'../db.js'
const router = express.Router()


/* GET lista de pessoas. */
router.get('/', async (req, res, next) => {

  try {
    const [people] = await db.execute({
      sql: 'SELECT * FROM person LEFT OUTER JOIN zombie ON eatenBy = zombie.id',
      nestTables: true
    })

    // Exercício 3: negociação de conteúdo
    res.format({
      html: () => res.render('list-people', {
        people,
        success: req.flash('success'),
        error: req.flash('error')
      }),
      json: () => res.json({ people })
    })

  } catch (error) {
    console.error(error)
    error.friendlyMessage = 'Problema ao recuperar pessoas'
    next(error)
  }
})


/* PUT altera pessoa para morta por um certo zumbi */
router.put('/eaten/', async (req, res, next) => {
  const zombieId = req.body.zombie
  const personId = req.body.person

  if (!zombieId || !personId) {
    req.flash('error', 'Nenhum id de pessoa ou zumbi foi passado!')
    res.redirect('/')
    return;
  }

  try {
    const [result] = await db.execute(`UPDATE person 
                                       SET alive=false, eatenBy=?
                                       WHERE id=?`,
                                      [zombieId, personId])
    if (result.affectedRows !== 1) {
      req.flash('error', 'Não há pessoa para ser comida.')
    } else {
      req.flash('success', 'A pessoa foi inteiramente (não apenas cérebro) engolida.')
    }
    
  } catch (error) {
    req.flash('error', `Erro desconhecido. Descrição: ${error}`)

  } finally {
    res.redirect('/')
  }
})


/* GET formulario de registro de nova pessoa */
router.get('/new/', (req, res) => {
  res.render('new-person', {
    success: req.flash('success'),
    error: req.flash('error')
  })
})


/* POST registra uma nova pessoa — Exercício 1 */
router.post('/', async (req, res, next) => {
  const name = req.body.name

  try {
    await db.execute(
      'INSERT INTO person (id, name, alive, eatenBy) VALUES (NULL, ?, true, NULL)',
      [name]
    )
    req.flash('success', `Pessoa "${name}" cadastrada com sucesso!`)
  } catch (error) {
    req.flash('error', `Erro ao cadastrar pessoa: ${error}`)
  } finally {
    res.redirect('/people')
  }
})


/* DELETE uma pessoa — Exercício 2 */
router.delete('/:id', async (req, res, next) => {
  const id = req.params.id

  try {
    const [result] = await db.execute(
      'DELETE FROM person WHERE id=?',
      [id]
    )
    if (result.affectedRows !== 1) {
      req.flash('error', 'Pessoa não encontrada.')
    } else {
      req.flash('success', 'Pessoa excluída com sucesso!')
    }
  } catch (error) {
    req.flash('error', `Erro ao excluir pessoa: ${error}`)
  } finally {
    res.redirect('/people')
  }
})


export default router