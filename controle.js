import { db } from './firebase.js';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
let usuarioLogado = null;

import { signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  habilitarAcoes(false);
  function enterKeyListener(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginBtn.click();
    }
  }

  if (loginEmail) loginEmail.addEventListener('keydown', enterKeyListener);
  if (loginPassword) loginPassword.addEventListener('keydown', enterKeyListener);
});


let metricasVisiveis = false;

// Função para mostrar o modal de login
function mostrarModalLogin() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'block';
}

// Função para esconder o modal de login
function esconderModalLogin() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'none';
}

// Evento do botão de login
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginPassword').value;
  const loginError = document.getElementById('loginError');
  loginError.style.display = 'none';

  signInWithEmailAndPassword(auth, email, senha)
    .then((userCredential) => {
      usuarioLogado = userCredential.user;
      esconderModalLogin();
      // Exibir nome do responsável na interface, por exemplo:
      mostrarResponsavel(usuarioLogado.email);
    })
    .catch((error) => {
      loginError.textContent = 'Erro no login: ' + error.message;
      loginError.style.display = 'block';
    });
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioLogado = user;
    esconderModalLogin();
    mostrarResponsavel(usuarioLogado.email);
    document.getElementById('responsavelDisplay').style.display = 'flex';
    document.getElementById('loginDisplay').style.display = 'none';
    habilitarAcoes(true);
  } else {
    usuarioLogado = null;
    document.getElementById('responsavelDisplay').style.display = 'none';
    document.getElementById('loginDisplay').style.display = 'block';
    habilitarAcoes(false);

  if (!sessionStorage.getItem('consultaMensagemExibida')) {
    Swal.fire({
  title: 'Modo Consulta',
  text: 'Você está em modo de consulta. Para realizar alterações, por favor, faça login.',
  icon: 'info',
  showCancelButton: true,
  confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Login',
  cancelButtonText: 'Ok, Sair',
  allowOutsideClick: true,
  allowEscapeKey: true,
  customClass: {
    confirmButton: 'swal2-confirm-login-btn',
    cancelButton: 'swal2-cancel-exit-btn'
  }
}).then((result) => {
        if (result.isConfirmed) {
          const modal = document.getElementById('loginModal');
          if (modal) modal.style.display = 'block';
        }
      });
      sessionStorage.setItem('consultaMensagemExibida', 'true');
    }
  }
});

document.getElementById('closeLoginModal').addEventListener('click', () => {
  esconderModalLogin();
});

function habilitarAcoes(habilitar) {
  const aprovarBtns = document.querySelectorAll('.aprovar-btn');
  const apagarBtns = document.querySelectorAll('.apagar-btn');

  aprovarBtns.forEach(btn => {
    btn.style.opacity = habilitar ? '1' : '0.5';
    btn.style.pointerEvents = 'auto'; // Mantém clicável mesmo transparente
  });
  apagarBtns.forEach(btn => {
    btn.style.opacity = habilitar ? '1' : '0.5';
    btn.style.pointerEvents = 'auto'; // Mantém clicável mesmo transparente
  });
}


document.getElementById('loginPageBtn').addEventListener('click', () => {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'block';
});

function mostrarModoConsulta() {
  Swal.fire({
    title: 'Modo Consulta',
    text: 'Você está em modo de consulta. Para realizar alterações, por favor, faça login.',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Login',
    cancelButtonText: 'Ok, Sair',
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      confirmButton: 'swal2-confirm-login-btn',
      cancelButton: 'swal2-cancel-exit-btn'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'block';
    }
  });
}
// Função para exibir o responsável na interface
function mostrarResponsavel(email) {
  const nome = extrairNomeDoEmail(email);
  let respElem = document.getElementById('responsavelDisplay');
  if (!respElem) {
    respElem = document.createElement('div');
    respElem.id = 'responsavelDisplay';
    respElem.style.margin = '10px 0';
    respElem.style.fontWeight = '600';
    respElem.style.color = 'var(--primary-color)';
    respElem.style.display = 'flex';
    respElem.style.alignItems = 'center';
    respElem.style.gap = '10px';

    const container = document.querySelector('.container');
    if (container) container.insertBefore(respElem, container.firstChild);
  }
  const nomeSpan = document.getElementById('responsavelNome');
if (nomeSpan) nomeSpan.textContent = nome;

 // Evento ao botão logout1
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    const nomeUsuario = extrairNomeDoEmail(usuarioLogado?.email || 'Usuário');

    Swal.fire({
      title: `Deseja sair, ${nomeUsuario}?`,
      text: "Você será desconectado da sessão atual.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        signOut(auth).then(() => {
          Swal.fire({
            title: 'Logout realizado!',
            text: 'Você saiu da sua conta com sucesso.',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
           habilitarAcoes(false);
        }).catch((error) => {
          console.error('Erro ao fazer logout:', error);
          Swal.fire('Erro', 'Erro ao fazer logout. Tente novamente.', 'error');
        });
      }
    });
  });
}
}

// Função para extrair nome do e-mail (antes do @ e formatar)
function extrairNomeDoEmail(email) {
  if (!email) return '';
  let nome = email.split('@')[0];
  nome = nome.replace('.', ' ');
  nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  return nome;
}

const tabela = document.querySelector('#tabelaColaboradores tbody');
const unidadeSelect = document.getElementById('filterUnidade');
if (unidadeSelect) {
unidadeSelect.addEventListener('change', () => {
  carregarColaboradores(unidadeSelect.value.trim(), filtroGeral.value.trim(), filtroStatus.value);
});
}
const filtroGeral = document.getElementById('filtroGeral');
const filtroStatus = document.getElementById('filtroStatus');
const filtrarBtn = document.getElementById('filtrarBtn');
const limparBtn = document.getElementById('limparBtn');

async function carregarColaboradores(unidade = "", buscaGeral = "", status = "") {
  const tabela = document.querySelector('#tabelaColaboradores tbody');
  if (!tabela) return;

const semFiltro =
  (unidade === "" || unidade === null) &&
  (status === "" || status === null) &&
  !buscaGeral;

  if (semFiltro) {
  tabela.innerHTML = `
    <tr>
      <td colspan="8" class="no-results">
        <i class="fas fa-info-circle"></i> Aplique pelo menos um filtro para visualizar os colaboradores.
      </td>
    </tr>
  `;
  atualizarContadores(0, 0);
  await atualizarTotalizadores(); // chama para atualizar totais independentes dos filtros
  return;
}
  try {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i> Carregando colaboradores...
        </td>
      </tr>
    `;

    const colaboradoresRef = collection(db, "colaboradores");
    let q = colaboradoresRef;

    const unidadeFiltrada = unidade !== "TODAS" ? unidade : null;
    const statusFiltrado = status !== "TODOS" ? status : null;

    if (unidadeFiltrada) q = query(q, where("unidade", "==", unidadeFiltrada));
    if (statusFiltrado) q = query(q, where("status", "==", statusFiltrado));

    // ...continua normalmente
    const querySnapshot = await getDocs(q);
    tabela.innerHTML = "";

    let colaboradores = [];
    querySnapshot.forEach(docSnap => {
      colaboradores.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Aplica filtro client-side (busca geral)
    if (buscaGeral) {
      const termoBusca = buscaGeral.toLowerCase();
      colaboradores = colaboradores.filter(colab => {
        const statusPrazo = (() => {
          if (
            colab.status &&
            colab.status.toLowerCase() === 'assinatura enviada' &&
            colab.dataEnvio &&
            colab.dataConclusao
          ) {
            const dataEnvio = new Date(colab.dataEnvio);
            const dataPrazo = calcularPrazoDoisDiasUteis(dataEnvio);
            const dataConclusao = new Date(colab.dataConclusao);
            return dataConclusao <= dataPrazo ? 'no prazo' : 'atrasado';
          }
          return '';
        })();

        const responsavelNome = colab.responsavel
          ? extrairNomeDoEmail(colab.responsavel).toLowerCase()
          : '';

        return (
          (colab.nome && colab.nome.toLowerCase().includes(termoBusca)) ||
          (colab.unidade && colab.unidade.toLowerCase().includes(termoBusca)) ||
          (colab.setor && colab.setor.toLowerCase().includes(termoBusca)) ||
          (colab.email && colab.email.toLowerCase().includes(termoBusca)) ||
          (colab.telefoneFixo && colab.telefoneFixo.toLowerCase().includes(termoBusca)) ||
          (colab.celularCorporativo && colab.celularCorporativo.toLowerCase().includes(termoBusca)) ||
          (colab.status && colab.status.toLowerCase().includes(termoBusca)) ||
          statusPrazo.includes(termoBusca) ||
          responsavelNome.includes(termoBusca)
        );
      });
    }

    // 🟨 Nenhum colaborador encontrado após filtros
    if (colaboradores.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="8" class="no-results">
            <i class="fas fa-info-circle"></i> Nenhum colaborador encontrado
          </td>
        </tr>
      `;
      atualizarContadores(0, 0);
      atualizarTotalizadores(); // ainda atualiza totais com base nos filtros
      return;
    }

    // Inicializar contadores
    let pendentes = 0;
    let concluidos = 0;

    colaboradores.forEach((data) => {
      if (data.status.toLowerCase() === 'pendente') pendentes++;
      if (data.status.toLowerCase() === 'assinatura enviada') concluidos++;

      const tr = document.createElement("tr");

      let statusClass = '';
      let statusIcon = '';
      switch (data.status.toLowerCase()) {
        case 'pendente':
          statusClass = 'status-pendente';
          statusIcon = 'clock';
          break;
        case 'assinatura enviada':
          statusClass = 'status-aprovado';
          statusIcon = 'check-circle';
          break;
        case 'rejeitado':
          statusClass = 'status-rejeitado';
          statusIcon = 'times-circle';
          break;
      }

      const dataEnvio = data.dataEnvio ? new Date(data.dataEnvio) : null;
      const dataPrazo = dataEnvio ? calcularPrazoDoisDiasUteis(dataEnvio) : null;
      const dataConclusao = data.dataConclusao ? new Date(data.dataConclusao) : null;

      let statusPrazo = '';
      if (data.status === 'Assinatura Enviada' && dataConclusao && dataPrazo) {
        statusPrazo = dataConclusao <= dataPrazo ? ' (No Prazo)' : ' (Atrasado)';
        statusClass = dataConclusao <= dataPrazo ? 'status-no-prazo' : 'status-atrasado';
      }

      tr.innerHTML = `
        <td>${data.nome}</td>
        <td>${data.unidade}</td>
        <td>${data.setor}</td>
        <td>${data.email || '-'}</td>
        <td>${data.telefoneFixo || '-'}</td>
        <td>${data.celularCorporativo || '-'}</td>
        <td class="${statusClass}">
          <div class="status-container">
            <div class="status-header">
              <span><i class="fas fa-${statusIcon}"></i> ${data.status}</span>
            </div>
            ${data.dataEnvio ? `
              <div class="metrics-info" style="display: none;">
                <span class="metric-item"><i class="fas fa-paper-plane"></i> Envio: ${formatarData(dataEnvio)}</span>
                <span class="metric-item"><i class="fas fa-clock"></i> Prazo: ${formatarData(dataPrazo)}</span>
                ${dataConclusao ? `<span class="metric-item"><i class="fas fa-check-circle"></i> Conclusão: ${formatarData(dataConclusao)}</span>` : ''}
                <span class="metric-item"><i class="fas fa-clock"></i> Pontualidade: ${statusPrazo}</span>
                <span class="metric-item"><i class="fas fa-user"></i> Responsável: ${data.responsavel ? extrairNomeDoEmail(data.responsavel) : '-'}</span>
              </div>
            ` : ''}
          </div>
        </td>
        <td>
          <div class="acoes-wrapper">
            ${data.status === "Pendente" ? `
              <button onclick="atualizarStatus('${data.id}', '${data.nome}')" class="acoes-btn aprovar-btn" title="Concluir">
                <i class="fas fa-check"></i>
              </button>` : ''}
            ${data.oldSignature ? `
              <button onclick="visualizarAssinaturaAntiga('${data.id}')" class="acoes-btn visualizar-btn" title="Ver Assinatura Antiga">
                <i class="fas fa-eye"></i>
              </button>` : ''}
            <button onclick="apagarRegistro('${data.id}')" class="acoes-btn apagar-btn" title="Apagar Registro">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      const metricsRow = document.createElement('tr');
      metricsRow.className = 'metrics-row';
      metricsRow.setAttribute('data-cpf', data.cpf);
      metricsRow.innerHTML = `
        <td class="metrics-cell" colspan="8">
          <div class="metrics-grid">
            <div class="metric-item"><div class="metric-label"><i class="fas fa-calendar-alt"></i> Envio:</div><div class="metric-value">${dataEnvio ? formatarData(dataEnvio) : '-'}</div></div>
            <div class="metric-item"><div class="metric-label"><i class="fas fa-calendar-check"></i> Prazo:</div><div class="metric-value">${dataPrazo ? formatarData(dataPrazo) : '-'}</div></div>
            <div class="metric-item"><div class="metric-label"><i class="fas fa-calendar-check"></i> Conclusão:</div><div class="metric-value">${dataConclusao ? formatarData(dataConclusao) : '-'}</div></div>
            <div class="metric-item"><div class="metric-label"><i class="fas fa-clock"></i> Pontualidade:</div><div class="metric-value">${statusPrazo || '-'}</div></div>
            <div class="metric-item"><div class="metric-label"><i class="fas fa-user"></i> Responsável:</div><div class="metric-value">${data.responsavel ? extrairNomeDoEmail(data.responsavel) : '-'}</div></div>
          </div>
        </td>
      `;

      tabela.appendChild(tr);
      tabela.appendChild(metricsRow);
    });

    atualizarContadores(pendentes, concluidos);
    atualizarTotalizadores();

  } catch (error) {
    console.error('Erro ao carregar colaboradores:', error);
    tabela.innerHTML = `
      <tr>
        <td colspan="6" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> Erro ao carregar dados. Tente novamente.
        </td>
      </tr>
    `;
  }

  aplicarVisibilidadeDasMetricas();
  const metricsBtn = document.querySelector('.metrics-btn');
  if (metricasVisiveis) {
    metricsBtn?.classList.add('active');
  } else {
    metricsBtn?.classList.remove('active');
  }
}


// Adicionar listener para filtroStatus para carregar dados ao mudar seleção
filtroStatus.addEventListener('change', () => {
  carregarColaboradores(unidadeSelect.value.trim(), filtroGeral.value.trim(), filtroStatus.value);
});

async function atualizarTotalizadores() {
  try {
    const colaboradoresRef = collection(db, "colaboradores");
    const querySnapshot = await getDocs(colaboradoresRef);

    let pendentesTotal = 0;
    let concluidosTotal = 0;

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status && data.status.toLowerCase() === 'pendente') {
        pendentesTotal++;
      } else if (data.status && data.status.toLowerCase() === 'assinatura enviada') {
        concluidosTotal++;
      }
    });

    const pendentesTotalElem = document.getElementById('pendentesTotalCount');
    const concluidosTotalElem = document.getElementById('concluidosTotalCount');
    const totalTotalElem = document.getElementById('totalTotalCount');

    if (pendentesTotalElem) pendentesTotalElem.textContent = pendentesTotal;
    if (concluidosTotalElem) concluidosTotalElem.textContent = concluidosTotal;
    if (totalTotalElem) totalTotalElem.textContent = pendentesTotal + concluidosTotal;

  } catch (error) {
    console.error('Erro ao atualizar totalizadores:', error);
  }
}

// Função auxiliar para atualizar os contadores no display
function atualizarContadores(pendentes, concluidos) {
  const pendentesCountElem = document.getElementById('pendentesCount');
  const concluidosCountElem = document.getElementById('concluidosCount');
  const totalCountElem = document.getElementById('totalCount');

  if (pendentesCountElem) pendentesCountElem.textContent = pendentes;
  if (concluidosCountElem) concluidosCountElem.textContent = concluidos;
  if (totalCountElem) totalCountElem.textContent = pendentes + concluidos;
  aplicarVisibilidadeDasMetricas();
}

window.apagarRegistro = async (cpf) => {
  if (!usuarioLogado) {
    mostrarModoConsulta();
    return;
  }

  try {
    const docRef = doc(db, "colaboradores", cpf);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await Swal.fire({
        icon: 'error',
        title: 'Registro não encontrado',
        text: 'Não foi possível localizar os dados deste colaborador.',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const data = docSnap.data();

    const linkIndex = `https://abelsilvabrandao.github.io/inter.atualizacaoassinatura/`;

    const confirmacao = await Swal.fire({
      title: 'Excluir e Liberar Nova Solicitação?',
      html: `
        <div style="text-align: left; font-size: 15px;">
          <p>Você está prestes a <strong>excluir</strong> o registro abaixo:</p>
          <ul style="line-height: 1.6; padding-left: 16px;">
            <li><strong>Nome:</strong> ${data.nome}</li>
            <li><strong>Unidade:</strong> ${data.unidade || '-'}</li>
            <li><strong>Setor:</strong> ${data.setor || '-'}</li>
            <li><strong>CPF:</strong> ${cpf}</li>
            <li><strong>Status atual:</strong> ${data.status || '-'}</li>
          </ul>
          <p style="margin-top: 10px; color: #dc3545;">
            Esta ação removerá a solicitação atual e permitirá que o colaborador <strong>${data.nome}</strong>
            possa enviar uma nova solicitação pelo sistema de assinatura.
          </p>
          <div style="margin-top: 15px; padding: 10px; background: #f1f1f1; border-radius: 6px;">
            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Link para envio:</strong></div>
            <input type="text" value="${linkIndex}" id="copyLinkInput" readonly style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px;">
            <button onclick="navigator.clipboard.writeText('${linkIndex}')" style="margin-top: 8px; padding: 5px 10px; font-size: 13px; background-color: #006400; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Copiar Link
            </button>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir e liberar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmacao.isConfirmed) return;

    await deleteDoc(docRef);

    await Swal.fire({
      icon: 'success',
      title: 'Registro Removido',
      html: `
        <p>O colaborador <strong>${data.nome}</strong> foi excluído com sucesso.</p>
        <p style="font-size: 13px; color: #777;">Agora ele poderá reenviar a solicitação de assinatura normalmente.</p>
      `,
      confirmButtonColor: '#28a745'
    });

    carregarColaboradores(unidadeSelect.value, filtroGeral.value, filtroStatus.value);
  } catch (error) {
    console.error('Erro ao apagar registro:', error);
    carregarColaboradores(unidadeSelect.value, filtroGeral.value, filtroStatus.value);
    await Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível concluir a exclusão. Tente novamente.',
      confirmButtonColor: '#dc3545'
    });
  }

  aplicarVisibilidadeDasMetricas();
};



window.visualizarAssinaturaAntiga = async (cpf) => {
  try {
    const docRef = doc(db, "colaboradores", cpf);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().oldSignature) {
      await Swal.fire({
        title: 'Assinatura Antiga',
        html: `
          <div style="margin: 20px 0;">
            <img src="${docSnap.data().oldSignature}" style="max-width: 100%; max-height: 400px; border: 1px solid #ddd; border-radius: 4px;">
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              Data de envio: ${new Date(docSnap.data().dataEnvio).toLocaleDateString('pt-BR')}
            </p>
          </div>
        `,
        width: 600,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Fechar'
      });
    } else {
      await Swal.fire({
        icon: 'info',
        title: 'Assinatura não encontrada',
        text: 'Não há assinatura antiga disponível para este colaborador.',
        confirmButtonColor: '#28a745'
      });
    }
  } catch (error) {
    console.error('Erro ao visualizar assinatura:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível carregar a assinatura. Tente novamente.',
      confirmButtonColor: '#dc3545'
    });
  }
};

// Função para formatar data em DD/MM/YYYY HH:mm
function formatarData(data) {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função para calcular prazo de 2 dias úteis
function calcularPrazoDoisDiasUteis(dataInicial) {
  let data = new Date(dataInicial);
  let diasUteis = 0;

  while (diasUteis < 2) {
    data.setDate(data.getDate() + 1);
    // Verifica se não é sábado (6) nem domingo (0)
    if (data.getDay() !== 0 && data.getDay() !== 6) {
      diasUteis++;
    }
  }

  // Mantém o mesmo horário da data inicial
  data.setHours(dataInicial.getHours());
  data.setMinutes(dataInicial.getMinutes());
  data.setSeconds(dataInicial.getSeconds());
  data.setMilliseconds(dataInicial.getMilliseconds());

  return data;
}

// Função para alternar a visibilidade das métricas
function toggleMetrics() {
  const metricsBtn = document.querySelector('.metrics-btn');
  const metricsInfos = document.querySelectorAll('.metrics-info');
  metricasVisiveis = !metricasVisiveis; // alterna o estado global
  
  
  // Toggle botão
  metricsBtn.classList.toggle('active');
  
  // Toggle todas as métricas
  const shouldShow = metricsBtn.classList.contains('active');
  metricsInfos.forEach(info => {
    if (shouldShow) {
      info.style.display = 'flex';
      info.classList.add('visible');
    } else {
      info.style.display = 'none';
      info.classList.remove('visible');
    }
  });

  // Atualizar ícone do botão
  const icon = metricsBtn.querySelector('i');
  if (icon) {
    icon.style.transform = shouldShow ? 'rotate(180deg)' : 'rotate(0)';
  }
    aplicarVisibilidadeDasMetricas();
}

// Exportar função para o escopo global
window.toggleMetrics = toggleMetrics;

function aplicarVisibilidadeDasMetricas() {
  const metricsInfos = document.querySelectorAll('.metrics-info');
  metricsInfos.forEach(info => {
    if (metricasVisiveis) {
      info.style.display = 'flex';
      info.classList.add('visible');
    } else {
      info.style.display = 'none';
      info.classList.remove('visible');
    }
  });

  const metricsBtn = document.querySelector('.metrics-btn i');
  if (metricsBtn) {
    metricsBtn.style.transform = metricasVisiveis ? 'rotate(180deg)' : 'rotate(0)';
  }
}



window.atualizarStatus = async (cpf, nomeColaborador) => {
  if (!usuarioLogado) {
    Swal.fire({
      icon: 'info',
      title: 'Acesso restrito',
      text: 'Você precisa estar logado para executar essa ação.',
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#006400'
    });
    return;
  }

  const confirmacao = await Swal.fire({
    title: 'Confirmar Conclusão',
    html: `
      <p style="margin: 0 0 10px; font-size: 15px;">
        Você confirma que a assinatura de <strong>${nomeColaborador}</strong> foi realmente enviada por e-mail ao colaborador?
      </p>
      <p style="font-size: 13px; color: #666;">
        Essa ação registrará seu nome como responsável e <u>não poderá ser desfeita</u>.
      </p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, confirmar envio',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d'
  });

  if (!confirmacao.isConfirmed) {
    return;
  }

  try {
    const docRef = doc(db, "colaboradores", cpf);
    await updateDoc(docRef, {
      status: "Assinatura Enviada",
      dataConclusao: new Date().toISOString(),
      responsavel: usuarioLogado.email
    });
    await Swal.fire({
      icon: 'success',
      title: 'Sistema de Gerenciamento de Assinaturas',
      html: `
        <div style="text-align: left;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #28a745; margin: 0; font-size: 18px;">Atualização de Status</h3>
          </div>
          <div style="padding: 0 15px;">
            <p style="margin-bottom: 15px; font-size: 15px;">
              <strong style="color: #495057;">Novo Status:</strong>
              <span style="color: #28a745; font-weight: 500;">Assinatura Enviada</span>
            </p>
            <p style="margin-bottom: 15px; font-size: 15px;">
              <strong style="color: #495057;">Data da Atualização:</strong>
              <span style="color: #495057;">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
            </p>
            <p style="margin-bottom: 15px; font-size: 15px;">
              <strong style="color: #495057;">Responsável:</strong>
              <span style="color: #495057;">${extrairNomeDoEmail(usuarioLogado.email)}</span>
            </p>
            <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #28a745; margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-check-circle"></i>
                <span>Atualização realizada com sucesso</span>
              </p>
            </div>
          </div>
        </div>
      `,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Fechar',
      width: '550px'
    });
    carregarColaboradores(unidadeSelect.value, filtroGeral.value, filtroStatus.value);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível atualizar o status. Tente novamente.',
      confirmButtonColor: '#dc3545'
    });
  }
};

filtrarBtn.addEventListener("click", () => {
  carregarColaboradores(
    unidadeSelect.value.trim(),
    filtroGeral.value.trim(),
    filtroStatus.value
  );
});

limparBtn.addEventListener("click", () => {
  unidadeSelect.selectedIndex = 0; // volta para "Selecione a Unidade"
  filtroGeral.value = "";
  filtroStatus.selectedIndex = 0; // volta para "Selecione o Status"
  carregarColaboradores(); // vai cair no semFiltro e não carregar
});

carregarColaboradores();

document.getElementById('download-excel-button').addEventListener('click', () => {
  const tabela = document.querySelector('#tabelaColaboradores tbody');
  const linhas = tabela.querySelectorAll('tr');

  const possuiDados = Array.from(linhas).some(linha => 
    !linha.classList.contains('metrics-row') &&
    !linha.classList.contains('no-results') &&
    !linha.classList.contains('loading-message') &&
    linha.querySelectorAll('td').length > 1
  );

  if (!possuiDados) {
    Swal.fire({
      icon: 'info',
      title: 'Sem dados para exportar',
      text: 'Aplique um filtro primeiro para exportar colaboradores.',
      confirmButtonColor: '#006400'
    });
    return;
  }

  exportarColaboradoresParaExcel();
});


function exportarColaboradoresParaExcel() {
  const mostrarMetricas = document.querySelector('.metrics-btn')?.classList.contains('active');
  const tabela = document.querySelector('#tabelaColaboradores');
  const linhas = tabela.querySelectorAll('tbody > tr');
  const dados = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Se for linha de métricas, ignorar
    if (linha.classList.contains('metrics-row')) continue;

    const colunas = linha.querySelectorAll('td');
    if (colunas.length < 8) continue;

    const nome = colunas[0]?.textContent?.trim() || '';
    const unidade = colunas[1]?.textContent?.trim() || '';
    const setor = colunas[2]?.textContent?.trim() || '';
    const email = colunas[3]?.textContent?.trim() || '';
    const telefone = colunas[4]?.textContent?.trim() || '';
    const celular = colunas[5]?.textContent?.trim() || '';

    const statusHeaderSpan = colunas[6].querySelector('.status-header span');
    const statusTexto = statusHeaderSpan?.textContent?.split('Envio:')[0].trim() || '';

    const registro = {
      Nome: nome,
      Unidade: unidade,
      Setor: setor,
      Email: email,
      Telefone: telefone,
      Celular: celular,
      Status: statusTexto,
    };

    if (mostrarMetricas) {
      const metricsRow = linhas[i + 1];
      if (metricsRow?.classList.contains('metrics-row')) {
  const metricasDiv = metricsRow.querySelector('.metrics-grid');
  const metricItems = metricasDiv?.querySelectorAll('.metric-item') || [];

  metricItems.forEach(item => {
    const label = item.querySelector('.metric-label')?.textContent?.toLowerCase();
    const value = item.querySelector('.metric-value')?.textContent?.trim() || '';

    if (label.includes('envio')) registro.Envio = value;
    if (label.includes('prazo')) registro.Prazo = value;
    if (label.includes('conclusão')) registro.Conclusão = value;
    if (label.includes('pontualidade')) registro.Pontualidade = value;
    if (label.includes('responsável')) registro.Responsável = value;
  });
}
    }

    dados.push(registro);
  }

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
  XLSX.writeFile(wb, "colaboradores.xlsx");
}

