const api = (u, o) =>
    fetch(u, o).then(async r => {
        let j = await r.json();

        if (!r.ok) {
            throw Error(j.error);
        }

        return j;
    });


const br = v =>
    Number(v).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });


async function load() {

    let [s, t] = await Promise.all([
        api("/api/summary"),
        api("/api/transactions")
    ]);


    // Cards do dashboard
    cards.innerHTML = `
        <div class="card">
            <small>Saldo</small>
            <strong>${br(s.balance)}</strong>
        </div>

        <div class="card">
            <small>Receitas</small>
            <strong>${br(s.income)}</strong>
        </div>

        <div class="card">
            <small>Despesas</small>
            <strong>${br(s.expense)}</strong>
        </div>

        <div class="card">
            <small>Movimentações</small>
            <strong>${t.length}</strong>
        </div>
    `;


    // Gráfico mensal
    let mx = Math.max(
        ...s.monthly.map(x =>
            Math.max(x.income, x.expense)
        ),
        1
    );


    chart.innerHTML = s.monthly
        .map(x => `
            <div
                class="bar"
                title="${x.month}"
                style="
                    height: ${Math.max(
                        x.income / mx * 100,
                        x.expense / mx * 100,
                        3
                    )}%;
                "
            ></div>
        `)
        .join("");


    // Categorias
    let cm = Math.max(
        ...s.cats.map(x => x.total),
        1
    );


    cats.innerHTML = s.cats
        .map(x => `
            <div class="cat">

                <div>
                    ${x.category}
                    <b>${br(x.total)}</b>
                </div>

                <div class="track">
                    <i
                        style="width: ${x.total / cm * 100}%"
                    ></i>
                </div>

            </div>
        `)
        .join("");


    // Tabela de movimentações
    rows.innerHTML = t
        .map(x => `
            <tr>
                <td>${x.description}</td>
                <td>${x.category}</td>
                <td>${x.date}</td>
                <td>
                    ${
                        x.type === "expense"
                            ? "Despesa"
                            : "Receita"
                    }
                </td>
                <td>${br(x.amount)}</td>
                <td>
                    <button onclick="del(${x.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `)
        .join("");
}


// Abre o formulário
function openForm() {
    modal.className = "show";

    date.value = new Date()
        .toISOString()
        .slice(0, 10);
}


// Fecha o formulário
function closeForm() {
    modal.className = "";
}


// Salva uma nova movimentação
async function save(e) {
    e.preventDefault();

    try {

        await api("/api/transactions", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                description: desc.value,
                category: cat.value,
                amount: amount.value,
                type: type.value,
                date: date.value
            })
        });

        closeForm();

        e.target.reset();

        load();

    } catch (x) {

        err.textContent = x.message;
    }
}


// Exclui uma movimentação
async function del(id) {

    if (confirm("Excluir?")) {

        await api(
            "/api/transactions/" + id,
            {
                method: "DELETE"
            }
        );

        load();
    }
}


// Carrega os dados quando a página abre
load();