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

const tabela = document.querySelector('#tabelaColaboradores tbody');
const unidadeSelect = document.getElementById('filterUnidade');
if (unidadeSelect) {
  unidadeSelect.addEventListener('change', () => {
    carregarColaboradores(unidadeSelect.value, filtroSetor.value, filtroStatus.value);
  });
}
const filtroSetor = document.getElementById('filtroSetor');
const filtroStatus = document.getElementById('filtroStatus');
const filtrarBtn = document.getElementById('filtrarBtn');
const limparBtn = document.getElementById('limparBtn');

async function carregarColaboradores(unidade = "", setor = "", status = "") {
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
    if (setor) q = query(q, where("setor", "==", setor));
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
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement("tr");

      // Define status class and icon
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

      // Calcular datas
      const dataEnvio = data.dataEnvio ? new Date(data.dataEnvio) : null;
      const dataPrazo = dataEnvio ? calcularPrazoDoisDiasUteis(dataEnvio) : null;
      const dataConclusao = data.dataConclusao ? new Date(data.dataConclusao) : null;
      
      // Verificar status do prazo
      let statusPrazo = '';
      if (data.status === 'Assinatura Enviada' && dataConclusao && dataPrazo) {
        statusPrazo = dataConclusao <= dataPrazo ? ' (No Prazo)' : ' (Atrasado)';
        statusClass = dataConclusao <= dataPrazo ? 'status-no-prazo' : 'status-atrasado';
      }

      // Linha principal com informações básicas
      // Linha principal com dados e ações
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
              </div>
            ` : ''}
          </div>
        </td>
        <td>
          <div class="acoes-wrapper">
            ${data.status === "Pendente" ? `
              <button onclick="atualizarStatus('${docSnap.id}')" class="acoes-btn aprovar-btn" title="Concluir">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            ${data.oldSignature ? `
              <button onclick="visualizarAssinaturaAntiga('${docSnap.id}')" class="acoes-btn visualizar-btn" title="Ver Assinatura Antiga">
                <i class="fas fa-eye"></i>
              </button>
            ` : ''}
            <button onclick="apagarRegistro('${docSnap.id}')" class="acoes-btn apagar-btn" title="Apagar Registro">
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
          </div>
        </td>
        <td></td>
      `;
      tabela.appendChild(metricsRow);
      tr.insertAdjacentElement('afterend', metricsRow);
      tabela.appendChild(tr);
    });
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

window.apagarRegistro = async (cpf) => {
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
      carregarColaboradores(unidadeSelect.value, filtroSetor.value, filtroStatus.value);
      await Swal.fire({
        icon: 'success',
        title: 'Registro Apagado!',
        text: 'O registro foi apagado com sucesso.',
        confirmButtonColor: '#28a745'
      });
    }
  } catch (error) {
    console.error('Erro ao apagar registro:', error);
    // Mesmo com erro, vamos tentar recarregar a tabela, pois o registro pode ter sido apagado
    carregarColaboradores(unidadeSelect.value, filtroSetor.value, filtroStatus.value);
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
  try {
    const docRef = doc(db, "colaboradores", cpf);
    await updateDoc(docRef, { 
      status: "Assinatura Enviada",
      dataConclusao: new Date().toISOString()
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
    carregarColaboradores(unidadeSelect.value, filtroSetor.value, filtroStatus.value);
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
    filtroSetor.value.trim(),
    filtroStatus.value
  );
});

limparBtn.addEventListener("click", () => {
  unidadeSelect.value = "";
  filtroSetor.value = "";
  filtroStatus.value = "";
  carregarColaboradores();
});

carregarColaboradores();
