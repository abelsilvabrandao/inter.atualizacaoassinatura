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
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        alert('Logout realizado com sucesso.');
        mostrarModalLogin();
      }).catch((error) => {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
      });
    });
  }
});

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
    mostrarModalLogin();
    document.getElementById('responsavelDisplay').style.display = 'none';
    document.getElementById('loginDisplay').style.display = 'block';
    habilitarAcoes(false);
  }
});

document.getElementById('closeLoginModal').addEventListener('click', () => {
  esconderModalLogin();
});

function habilitarAcoes(habilitar) {
  const aprovarBtns = document.querySelectorAll('.aprovar-btn');
  const apagarBtns = document.querySelectorAll('.apagar-btn');

  aprovarBtns.forEach(btn => btn.disabled = !habilitar);
  apagarBtns.forEach(btn => btn.disabled = !habilitar);

  // Opcional: alterar estilo para indicar desabilitado
  aprovarBtns.forEach(btn => btn.style.opacity = habilitar ? '1' : '0.5');
  apagarBtns.forEach(btn => btn.style.opacity = habilitar ? '1' : '0.5');
}

document.getElementById('loginPageBtn').addEventListener('click', () => {
  mostrarModalLogin();
});


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
  respElem.innerHTML = `
    <span>Responsável: ${nome}</span>
    <button id="logoutBtn" style="padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Sair</button>
  `;

  // Reatribuir evento ao botão logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        alert('Logout realizado com sucesso.');
        mostrarModalLogin();
      }).catch((error) => {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
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


    if (unidade) q = query(q, where("unidade", "==", unidade));
    if (status) q = query(q, where("status", "==", status));

    const querySnapshot = await getDocs(q);
    tabela.innerHTML = "";

    if (querySnapshot.empty) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="no-results">
            <i class="fas fa-info-circle"></i> Nenhum colaborador encontrado
          </td>
        </tr>
      `;
            // Atualizar contadores para zero
      atualizarContadores(0, 0);
      return;
    }
    // Converter para array e aplicar filtro cliente para o setor
    let colaboradores = [];
    querySnapshot.forEach(docSnap => {
      colaboradores.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (buscaGeral) {
    const termoBusca = buscaGeral.toLowerCase();
    colaboradores = colaboradores.filter(colab => {
    return (
      (colab.nome && colab.nome.toLowerCase().includes(termoBusca)) ||
      (colab.unidade && colab.unidade.toLowerCase().includes(termoBusca)) ||
      (colab.setor && colab.setor.toLowerCase().includes(termoBusca)) ||
      (colab.email && colab.email.toLowerCase().includes(termoBusca)) ||
      (colab.telefoneFixo && colab.telefoneFixo.toLowerCase().includes(termoBusca)) ||
      (colab.celularCorporativo && colab.celularCorporativo.toLowerCase().includes(termoBusca))
    );
  });
}


    if (colaboradores.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="8" class="no-results">
            <i class="fas fa-info-circle"></i> Nenhum colaborador encontrado
          </td>
        </tr>
      `;
      atualizarContadores(0, 0);
      return;
    }

        // Inicializar contadores
    let pendentes = 0;
    let concluidos = 0;

colaboradores.forEach((data) => {
  // Contar status
  if (data.status.toLowerCase() === 'pendente') {
    pendentes++;
  } else if (data.status.toLowerCase() === 'assinatura enviada') {
    concluidos++;
  }

  const tr = document.createElement("tr");

  let statusClass = '';
  let statusIcon = '';
  switch(data.status.toLowerCase()) {
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
          <span><i class="fas fa-${statusIcon}"></i> ${data.status}${statusPrazo}</span>
        </div>
        ${data.dataEnvio ? `
          <div class="metrics-info" style="display: none;">
            <span class="metric-item">
              <i class="fas fa-paper-plane"></i> Envio: ${formatarData(new Date(data.dataEnvio))}
            </span>
            <span class="metric-item">
              <i class="fas fa-clock"></i> Prazo: ${formatarData(dataPrazo)}
            </span>
            ${data.dataConclusao ? `
              <span class="metric-item">
                <i class="fas fa-check-circle"></i> Conclusão: ${formatarData(new Date(data.dataConclusao))}
              </span>   
            ` : ''}
            <span class="metric-item">
              <i class="fas fa-user"></i> Responsável: ${data.responsavel ? extrairNomeDoEmail(data.responsavel) : '-'}
            </span>
          </div>
        ` : ''}
      </div>
    </td>
    <td>
      <div class="acoes-wrapper">
        ${data.status === "Pendente" ? `
          <button onclick="atualizarStatus('${data.id}')" class="acoes-btn aprovar-btn" title="Concluir">
            <i class="fas fa-check"></i>
          </button>
        ` : ''}
        ${data.oldSignature ? `
          <button onclick="visualizarAssinaturaAntiga('${data.id}')" class="acoes-btn visualizar-btn" title="Ver Assinatura Antiga">
            <i class="fas fa-eye"></i>
          </button>
        ` : ''}
        <button onclick="apagarRegistro('${data.id}')" class="acoes-btn apagar-btn" title="Apagar Registro">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  `;

      // Linha de métricas (oculta por padrão)
      const metricsRow = document.createElement('tr');
      metricsRow.className = 'metrics-row';
      metricsRow.setAttribute('data-cpf', data.cpf);
metricsRow.innerHTML = `
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td class="metrics-cell">
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">
          <i class="fas fa-calendar-alt"></i> Envio:
        </div>
        <div class="metric-value">${dataEnvio ? formatarData(dataEnvio) : '-'}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">
          <i class="fas fa-calendar-check"></i> Prazo:
        </div>
        <div class="metric-value">${dataPrazo ? formatarData(dataPrazo) : '-'}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">
          <i class="fas fa-calendar-check"></i> Conclusão:
        </div>
        <div class="metric-value">${dataConclusao ? formatarData(dataConclusao) : '-'}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">
          <i class="fas fa-user"></i> Responsável:
        </div>
        <div class="metric-value">${data.responsavel ? extrairNomeDoEmail(data.responsavel) : '-'}</div>
      </div>
    </div>
  </td>
  <td></td>
`;
      tabela.appendChild(metricsRow);
      tr.insertAdjacentElement('afterend', metricsRow);
      tabela.appendChild(tr);
    });

        // Atualizar os contadores no display
    atualizarContadores(pendentes, concluidos);

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
}

// Adicionar listener para filtroStatus para carregar dados ao mudar seleção
filtroStatus.addEventListener('change', () => {
  carregarColaboradores(unidadeSelect.value.trim(), filtroGeral.value.trim(), filtroStatus.value);
});


// Função auxiliar para atualizar os contadores no display
function atualizarContadores(pendentes, concluidos) {
  const pendentesCountElem = document.getElementById('pendentesCount');
  const concluidosCountElem = document.getElementById('concluidosCount');
  const totalCountElem = document.getElementById('totalCount');

  if (pendentesCountElem) pendentesCountElem.textContent = pendentes;
  if (concluidosCountElem) concluidosCountElem.textContent = concluidos;
  if (totalCountElem) totalCountElem.textContent = pendentes + concluidos;
}

window.apagarRegistro = async (cpf) => {
  if (!usuarioLogado) {
    alert('Você precisa estar logado para apagar registros.');
    mostrarModalLogin();
    return;
  }
  try {
    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: 'Tem certeza que deseja apagar este registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, apagar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const docRef = doc(db, "colaboradores", cpf);
      await deleteDoc(docRef);
      carregarColaboradores(unidadeSelect.value, filtroGeral.value, filtroStatus.value);
      await Swal.fire({
        icon: 'success',
        title: 'Registro Apagado!',
        text: 'O registro foi apagado com sucesso.',
        confirmButtonColor: '#28a745'
      });
    }
  } catch (error) {
    console.error('Erro ao apagar registro:', error);
    carregarColaboradores(unidadeSelect.value, filtroGeral.value, filtroStatus.value);
    await Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Houve um erro ao confirmar a exclusão, mas o registro pode ter sido apagado. Verifique a tabela.',
      confirmButtonColor: '#ffc107'
    });
  }
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
}

// Exportar função para o escopo global
window.toggleMetrics = toggleMetrics;

window.atualizarStatus = async (cpf) => {
  if (!usuarioLogado) {
    alert('Você precisa estar logado para atualizar o status.');
    mostrarModalLogin();
    return;
  }
  try {
    const docRef = doc(db, "colaboradores", cpf);
    await updateDoc(docRef, { 
      status: "Assinatura Enviada",
      dataConclusao: new Date().toISOString(),
      responsavel: usuarioLogado.email // registra o e-mail do responsável
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
  unidadeSelect.value = "";
  filtroGeral.value = "";
  filtroStatus.value = "";
  carregarColaboradores();
});

carregarColaboradores();
