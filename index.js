export default class Game {

    #keyboard = document.querySelector('.keyboard')
    #letters = "QWERTYUIOPASDFGHJKLZXCVBNM".split("")

    #board = document.querySelector('.board')
    #lines = []
    #pieces
    #word = "REGUA"
    #word_as_array = this.#word.split("")
    #won = false
    #attempts = 0
    #currentRow = 0
    #currentColumn = 0

    static STATUS = {
        RIGHT: '--right',
        PLACE: '--place',
        WRONG: '--wrong'
    }

    static MIN_ROW_INDEX = 0
    static MAX_ROW_INDEX = 5

    static MIN_COLUMN_INDEX = 0
    static MAX_COLUMN_INDEX = 4

    constructor() {
        this.build_board()
        this.build_keyboard()
        this.listen_to_keyboard()
    }

    validate(guess) {
        let word = [...this.#word_as_array]
        let removed = 0
        let correctly = 0

        const response = guess.map((letter, index) => {

            const index_in_word = this.findIndexAndRemove(word, letter)

            if (index_in_word === undefined) {
                return {
                    letter,
                    status: Game.STATUS.WRONG
                }
            }

            const is_same_index = index_in_word === (index - removed)

            removed++

            if (is_same_index) {
                correctly++
                return {
                    letter,
                    status: Game.STATUS.RIGHT
                }
            }

            return {
                letter,
                status: Game.STATUS.PLACE
            }
        })

        if (correctly === guess.length) {
            this.#won = true
        }


        return response
    }

    handle_add_letter(letter) {
        const piece = this.get_current_piece()

        piece.textContent = letter

        this.#currentColumn = Math.min(this.#currentColumn + 1, Game.MAX_COLUMN_INDEX)

        this.change_current_piece()
    }

    handle_remove_letter() {

        const piece = this.get_current_piece()

        piece.textContent = ''

        this.#currentColumn = Math.max(this.#currentColumn - 1, Game.MIN_COLUMN_INDEX)

        this.change_current_piece()
    }

    wait(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout))
    }

    async handle_validate_attempt() {
        const guess = this.#pieces.at(this.#currentRow).map(piece => piece.textContent)

        if (guess.some(letter => letter === '')) return

        const animation = this.validate(guess).map(async ({ status, letter }, index) => {

            return this.wait((index * 350)).then(() => {

                const piece = this.piece_at(index)
                const button = document.querySelector(`[data-letter="${letter}"]`)

                button.classList.add(status)

                if (status === Game.STATUS.WRONG) {
                    button.setAttribute('disabled', 'disabled')
                }

                piece.setAttribute('disabled', 'disabled')
                piece.classList.remove('--empty', '--current')
                piece.classList.add('--flip', status)
            })

        })

        await Promise.all(animation)

        if (this.#won === true) {
            return this.handle_won_game()
        }

        if (this.#attempts > 5) {
            return this.handle_maximum_attempt()
        }

        this.#attempts++
        this.change_row()
    }

    get board() {
        return this.#board
    }

    configure_conffetti() {
        new JSConfetti().addConfetti()
    }

    handle_won_game() {
        this.configure_conffetti()
        this.#board.click()
    }

    change_row() {
        this.#lines.at(this.#currentRow).classList.remove('--current')
        this.#lines.at(this.#currentRow + 1).classList.add('--current')

        this.#currentColumn = 0
        this.#currentRow = Math.min(this.#currentRow + 1, Game.MAX_ROW_INDEX)
        this.change_current_piece()
    }

    handle_button_click(action) {
        if (this.#won === true) return

        switch (action) {
            case 'ENTER': return this.handle_validate_attempt()
            case 'BACKSPACE': return this.handle_remove_letter()
            default: return this.handle_add_letter(action)
        }
    }

    get_current_piece() {
        return this.#pieces.at(this.#currentRow).at(this.#currentColumn)
    }

    handle_change_column_index(column_index) {
        if (this.#won === true) return

        this.#currentColumn = Math.min(column_index, Game.MAX_COLUMN_INDEX)
        this.change_current_piece()
    }

    change_current_piece() {
        this.#pieces.at(this.#currentRow).forEach((it, column_index) => {

            if (column_index === this.#currentColumn) {
                it.classList.add('--current')
            }
            else {
                it.classList.remove('--current')
            }
        })
    }

    piece_at(index) {
        return this.#pieces.at(this.#currentRow).at(index)
    }

    build_keyboard() {
        const actions = [
            ...this.#letters,
            'ENTER',
            'BACKSPACE'
        ]

        actions.forEach((action) => {
            const button = document.createElement('button')
            button.dataset.letter = action
            button.textContent = action == 'BACKSPACE' ? '←' : action
            button.addEventListener('click', () => this.handle_button_click(action))

            this.#keyboard.insertAdjacentElement('beforeend', button)
        })
    }

    listen_to_keyboard() {
        window.addEventListener('keydown', ({ key }) => {
            const action = key.toUpperCase()

            if (action === 'ENTER' || action === 'BACKSPACE' || this.#letters.includes(action)) {
                this.handle_button_click(action)
            }
        })
    }

    build_board() {
        this.#pieces = Array.from({ length: 6 }, (_, row_index) => {
            const line = document.createElement('div')
            line.classList.add('board__line')

            if (row_index === 0) {
                line.classList.add('--current')
            }

            const columns = Array.from({ length: 5 }, (_, column_index) => {
                const column = document.createElement('span')
                column.classList.add('board__word', '--empty')

                column.addEventListener('click', () => this.handle_change_column_index(column_index))

                line.insertAdjacentElement('beforeend', column)

                return column
            })

            this.#board.insertAdjacentElement('beforeend', line)
            this.#lines.push(line)

            return columns
        })
    }

    change_word(word) {
        this.#word = word
        this.#word_as_array = word.toUpperCase().split("")
    }

    findIndexAndRemove(word, letter) {
        const index = word.findIndex(it => it === letter)

        if (index < 0) return undefined

        word.splice(index, 1)

        return index
    }
}