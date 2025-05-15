import { db, doc, setDoc, getDoc } from './firebase.js';

// Função para formatar nome
function formatarNome(nome) {
  const conectores = ['de', 'da', 'das', 'do', 'dos', 'e'];
  
  return nome.toLowerCase().split(' ').map((palavra, index) => {
    // Se for um conector, mantém em minúsculo
    if (conectores.includes(palavra.toLowerCase())) {
      return palavra.toLowerCase();
    }
    // Caso contrário, capitaliza a primeira letra
    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
  }).join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
  // Formatação do nome
  const nomeInput = document.getElementById('nome');
  if (nomeInput) {
    nomeInput.addEventListener('input', function() {
      const cursorPos = this.selectionStart;
      const beforeCursor = this.value.slice(0, cursorPos);
      const afterCursor = this.value.slice(cursorPos);
      const beforeCursorSpaces = beforeCursor.split(' ').length - 1;
      
      this.value = formatarNome(this.value);
      
      // Restaura a posição do cursor
      const newCursorPos = this.value.split(' ', beforeCursorSpaces + 1).join(' ').length;
      this.setSelectionRange(
        cursorPos === this.value.length ? cursorPos : newCursorPos,
        cursorPos === this.value.length ? cursorPos : newCursorPos
      );
    });

    // Formata ao perder o foco (blur)
    nomeInput.addEventListener('blur', function() {
      this.value = formatarNome(this.value);
    });
  }

  // Função para validar CPF
  function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    for (let t = 9; t < 11; t++) {
      let d = 0;
      for (let c = 0; c < t; c++) {
        d += parseInt(cpf[c]) * ((t + 1) - c);
      }
      d = ((10 * d) % 11) % 10;
      if (parseInt(cpf[t]) !== d) return false;
    }
    return true;
  }

  // Máscara para CPF
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    const cpfMask = IMask(cpfInput, {
      mask: '000.000.000-00'
    });

    cpfInput.addEventListener('input', function() {
      const container = this.closest('.input-validation-container');
      const validIcon = container.querySelector('.valid-icon');
      const invalidIcon = container.querySelector('.invalid-icon');
      const cpfNumerico = this.value.replace(/[^\d]/g, '');

      if (cpfNumerico.length === 11) {
        const valido = validarCPF(cpfNumerico);
        this.style.borderColor = valido ? '#28a745' : '#dc3545';
        validIcon.classList.toggle('show', valido);
        invalidIcon.classList.toggle('show', !valido);
      } else {
        this.style.borderColor = '';
        validIcon.classList.remove('show');
        invalidIcon.classList.remove('show');
      }
    });

    // Validar e-mail corporativo
    const emailInput = document.getElementById('email');
    if (emailInput) {
      const dominiosPermitidos = [
        '@intermaritima.com.br',
        '@intersal.com.br'
      ];

      const emailSuggestions = emailInput.nextElementSibling.nextElementSibling.nextElementSibling;
      const suggestionItems = emailSuggestions.querySelectorAll('.email-suggestion-item');

      emailInput.addEventListener('input', function() {
        const container = this.closest('.input-validation-container');
        const validIcon = container.querySelector('.valid-icon');
        const invalidIcon = container.querySelector('.invalid-icon');
        const email = this.value.toLowerCase();
        const atIndex = email.lastIndexOf('@');

        // Mostrar sugestões quando digitar @
        if (atIndex !== -1) {
          const beforeAt = email.substring(0, atIndex);
          emailSuggestions.classList.add('show');

          // Verificar se algum domínio já foi digitado após o @
          const afterAt = email.substring(atIndex);
          suggestionItems.forEach(item => {
            const domain = item.dataset.domain;
            item.style.display = domain.startsWith(afterAt) ? 'block' : 'none';
          });
        } else {
          emailSuggestions.classList.remove('show');
        }

        const emailValido = dominiosPermitidos.some(dominio => email.endsWith(dominio));

        if (email && email.includes('@')) {
          this.style.borderColor = emailValido ? '#28a745' : '#dc3545';
          validIcon.classList.toggle('show', emailValido);
          invalidIcon.classList.toggle('show', !emailValido);
        } else {
          this.style.borderColor = '';
          validIcon.classList.remove('show');
          invalidIcon.classList.remove('show');
        }
      });

      // Clicar em uma sugestão
      suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
          const atIndex = emailInput.value.lastIndexOf('@');
          const beforeAt = atIndex !== -1 ? emailInput.value.substring(0, atIndex) : emailInput.value;
          emailInput.value = beforeAt + this.dataset.domain;
          emailSuggestions.classList.remove('show');
          emailInput.focus();
          // Disparar evento input para validar
          emailInput.dispatchEvent(new Event('input'));
        });
      });

      // Fechar sugestões ao clicar fora
      document.addEventListener('click', function(e) {
        if (!emailInput.contains(e.target) && !emailSuggestions.contains(e.target)) {
          emailSuggestions.classList.remove('show');
        }
      });
    }
  }

  // Máscara para telefone fixo
  const telefoneFixoInput = document.getElementById('telefoneFixo');
  if (telefoneFixoInput) {
    IMask(telefoneFixoInput, {
      mask: '(00) 0000-0000'
    });
  }

  // Máscara para celular
  const celularInput = document.getElementById('celularCorporativo');
  if (celularInput) {
    IMask(celularInput, {
      mask: '(00) 0 0000-0000'
    });
  }
});

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
  e.preventDefault();

    // ⛔️ Verificação da imagem da assinatura
  if (!signatureImage) {
    Swal.fire({
      icon: 'error',
      title: 'Imagem Obrigatória',
      text: 'Por favor, anexe sua assinatura atual antes de enviar o formulário.',
      confirmButtonColor: '#dc3545'
    });
    return;
  }

  const cpf = document.getElementById('cpf').value.trim();
  const docRef = doc(db, "colaboradores", cpf);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await Swal.fire({
      title: '<span style="color: #006400">Solicitação Existente</span>',
      html: `
        <div style="margin-bottom: 20px;">
          <i class="fas fa-info-circle" style="color: #006400; font-size: 24px; margin-bottom: 15px;"></i>
          <p style="margin: 15px 0; font-size: 16px;">Já existe uma solicitação de atualização de assinatura para este colaborador.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #006400; font-weight: bold; margin-bottom: 15px;">Suporte Técnico</p>
          <a href="https://wa.me/5571999863042" target="_blank" class="whatsapp-button">
            <i class="fab fa-whatsapp" style="margin-right: 8px;"></i>Contatar via WhatsApp
          </a>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#006400',
      confirmButtonText: 'Entendi',
      showClass: {
        popup: 'animate__animated animate__fadeIn'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut'
      }
    });
    return;
  }

  // Obter a imagem da assinatura se existir
  const oldSignature = signatureImage || null;
  
  const colaborador = {
    unidade: document.getElementById('unidade').value.trim(),
    nome: document.getElementById('nome').value.trim(),
    cpf: cpf,
    setor: document.getElementById('setor').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefoneFixo: document.getElementById('telefoneFixo').value.trim() || null,
    celularCorporativo: document.getElementById('celularCorporativo').value.trim() || null,
    status: "Pendente",
    oldSignature: oldSignature, // Adiciona a assinatura antiga se existir
    dataEnvio: new Date().toISOString() // Adiciona a data de envio
  };

  try {
    await setDoc(docRef, colaborador);
    await Swal.fire({
      title: '<span style="color: #006400">Solicitação Confirmada</span>',
      html: `
        <div style="margin: 20px 0;">
          <i class="fas fa-check-circle" style="color: #006400; font-size: 48px; margin-bottom: 20px;"></i>
          <p style="margin: 15px 0; font-size: 16px;">Prezado(a) <strong>${colaborador.nome}</strong>,</p>
          <p style="margin: 15px 0; line-height: 1.6;">
            Sua solicitação de atualização de assinatura foi registrada com sucesso!
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
            <p style="margin: 10px 0;"><i class="far fa-clock" style="color: #006400; margin-right: 8px;"></i> Prazo: <strong>2 dias úteis</strong></p>
            <p style="margin: 10px 0;"><i class="far fa-envelope" style="color: #006400; margin-right: 8px;"></i> Assunto: <strong>Sua Nova Assinatura de E-mail</strong></p>
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#006400',
      confirmButtonText: 'Fechar',
      showClass: {
        popup: 'animate__animated animate__fadeInUp'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown'
      }
    });
    // Resetar o formulário e limpar a imagem
    document.getElementById('cadastroForm').reset();
    document.getElementById('pasteArea').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    if (document.querySelector('input[name="signatureImage"]')) {
      document.querySelector('input[name="signatureImage"]').remove();
    }
  } catch (error) {
    let errorTitle = 'Erro no Sistema';
    let errorIcon = 'error';
    let errorMessage = `
      <div style="margin: 20px 0;">
        <i class="fas fa-exclamation-triangle" style="color: #D32F2F; font-size: 48px; margin-bottom: 20px;"></i>
        <p style="margin: 15px 0; color: #D32F2F;">Ocorreu um erro ao processar sua solicitação.</p>
    `;

    if (error.code === 'permission-denied') {
      errorMessage += '<p>Você não possui permissão para realizar esta ação. Por favor, contate o administrador do sistema.</p>';
    } else if (error.code === 'unavailable') {
      errorMessage += '<p>Não foi possível conectar ao servidor. Por favor, verifique sua conexão com a internet.</p>';
    }

    errorMessage += '</div>';

    await Swal.fire({
      title: `<span style="color: #D32F2F">${errorTitle}</span>`,
      html: errorMessage,
      icon: errorIcon,
      confirmButtonColor: '#D32F2F',
      confirmButtonText: 'Tentar Novamente',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut'
      }
    });

    console.error('Firebase Error:', error.code, error.message);
  }
});
