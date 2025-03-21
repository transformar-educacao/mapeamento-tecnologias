// Função para buscar e carregar os dados do JSON
async function loadData() {
  try {
    const response = await fetch('acoes.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
    return [];
  }
}

// Função para extrair domínio de uma URL
function extractDomain(url) {
  try {
    // Remover protocolo (http, https, etc) e obter o domínio
    let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    return domain;
  } catch (error) {
    console.error('Erro ao extrair domínio:', error);
    return '';
  }
}

// Função para obter o favicon de um site
function getFaviconUrl(url) {
  if (!url) return '/images/default-icon.png'; // Imagem padrão caso não haja URL
  
  const domain = extractDomain(url);
  if (!domain) return '/images/default-icon.png';
  
  // Usar o serviço do Google para obter favicons
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// Processa os dados para criar um objeto de ações únicas
async function processActions() {
  const rawData = await loadData();
  const actionsMap = new Map();
  
  // Processa os dados para criar ações únicas
  rawData.forEach(item => {
    const actionName = item["Descrição da ação com uso de Inteligência Artificial"];
    
    if (!actionsMap.has(actionName)) {
      const faviconUrl = item["Link para o site da ferramenta"] ? 
                        getFaviconUrl(item["Link para o site da ferramenta"]) : 
                        '/images/default-icon.png';

      actionsMap.set(actionName, {
        id: actionsMap.size + 1,
        name: actionName,
        description: actionName,
        solution: item["Solução utilizada"],
        metodologia: item["Metodologia"],
        observacoes: item["Observações"],
        departamento: item["Departamento Regional"],
        referencias: item["Referências"],
        categoria: item["Categoria"],
        url: item["Link para o site da ferramenta"],
        image: faviconUrl,
        responsavel: item["Nome do responsável pela ação"],
        email: item["E-mail Institucional"],
        unidade: item["Unidade Educacional, Segmento ou Área em que a ação foi desenvolvida"],
        custos: item["Estimativa de custos"],
        linkRegistro: item["Link do registro da iniciativa"],
        testimonials: []
      });
    }
    
    // Adiciona o departamento regional para esta ação (caso já não exista)
    if (!actionsMap.get(actionName).testimonials.some(t => t.department === item["Departamento Regional"])) {
      actionsMap.get(actionName).testimonials.push({
        name: `Departamento Regional ${item["Departamento Regional"]}`,
        department: item["Departamento Regional"],
        content: item["Metodologia"] || "",
        category: item["Categoria"],
        date: "2023" // Data padrão ou você pode extrair do JSON se disponível
      });
    }
  });
  
  // Converter o Map para um array
  return Array.from(actionsMap.values());
}

// Função simples de hash para strings
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Converte para inteiro de 32 bits
  }
  return hash;
}

// Variáveis globais para paginação
let actions = [];
let currentPage = 1;
const itemsPerPage = 9;
let filteredActions = [];
let totalPages = 1;

// Variáveis para armazenar estatísticas
let categoryStats = {};
let regionStats = {};

// Função para ver detalhes de uma ação específica
function viewDetails(index) {
  const action = filteredActions[index];
  
  // Armazenar todos os dados da ação no localStorage para uso na página de detalhamento
  localStorage.setItem('selectedAction', JSON.stringify({
    'Descrição da ação com uso de Inteligência Artificial': action.description,
    'Metodologia': action.metodologia,
    'Solução utilizada': action.solution,
    'Categoria': action.categoria,
    'Link para o site da ferramenta': action.url,
    'Nome do responsável pela ação': action.responsavel,
    'E-mail Institucional': action.email,
    'Departamento Regional': action.departamento,
    'Unidade Educacional, Segmento ou Área em que a ação foi desenvolvida': action.unidade,
    'Estimativa de custos': action.custos,
    'Referências': action.referencias,
    'Observações': action.observacoes,
    'Link do registro da iniciativa': action.linkRegistro
  }));
  
  // Redirecionamento explícito após armazenar os dados
  window.location.href = 'detalhamento.html';
}

// Função para calcular estatísticas
function calculateStats() {
  categoryStats = {};
  regionStats = {};
  
  actions.forEach(action => {
    // Estatísticas de categoria
    categoryStats[action.categoria] = (categoryStats[action.categoria] || 0) + 1;
    
    // Estatísticas de região
    regionStats[action.departamento] = (regionStats[action.departamento] || 0) + 1;
  });
}

// Função para inicializar o mapa do Brasil
async function createBrazilMap() {
  if (!document.getElementById('map-container')) return; // Verifica se o elemento existe

  // Carregar os dados do JSON
  const rawData = await loadData();

  // Criar o mapa
  const map = anychart.map();

  // Definir as regiões do Brasil
  const northCenterWest = ["BR.AC", "BR.AP", "BR.AM", "BR.PA", "BR.RO", "BR.RR", "BR.TO", "BR.MT", "BR.MS", "BR.GO", "BR.DF"];
  const northeast = ["BR.MA", "BR.PI", "BR.CE", "BR.RN", "BR.PB", "BR.PE", "BR.AL", "BR.SE", "BR.BA"];
  const southSoutheast = ["BR.PR", "BR.SC", "BR.RS", "BR.SP", "BR.RJ", "BR.ES", "BR.MG"];

  // Definir cores para cada região
  const colors = {
    northCenterWest: "#f7941d", 
    northeast: "#fdc180",
    southSoutheast: "#004a8d"
  };

  // Criar dataset para o mapa
  const mapData = [];

  // Adicionar todos os estados ao mapData com cor cinza por padrão
  const allStates = [
    'BR.AC', 'BR.AL', 'BR.AP', 'BR.AM', 'BR.BA', 'BR.CE', 'BR.DF', 'BR.ES', 'BR.GO', 
    'BR.MA', 'BR.MT', 'BR.MS', 'BR.MG', 'BR.PA', 'BR.PB', 'BR.PR', 'BR.PE', 'BR.PI', 
    'BR.RJ', 'BR.RN', 'BR.RS', 'BR.RO', 'BR.RR', 'BR.SC', 'BR.SP', 'BR.SE', 'BR.TO'
  ];

  allStates.forEach(stateCode => {
    mapData.push({
      id: stateCode,
      value: 1, // Valor padrão apenas para mostrar no tooltip
      fill: "#ccc" // Cor cinza por padrão
    });
  });

  // Destacar os estados que possuem ações
  rawData.forEach(action => {
    const stateCode = mapDepartmentToStateCode(action["Departamento Regional"]);
    if (stateCode) {
      const regionColor = northCenterWest.includes(stateCode)
        ? colors.northCenterWest
        : northeast.includes(stateCode)
        ? colors.northeast
        : southSoutheast.includes(stateCode)
        ? colors.southSoutheast
        : "#ccc";

      // Atualizar a cor do estado no mapData
      const stateData = mapData.find(data => data.id === stateCode);
      if (stateData) {
        stateData.fill = regionColor;
      }
    }
  });

  // Criar dataset
  const dataSet = anychart.data.set(mapData);

  // Criar série choropleth
  const series = map.choropleth(dataSet);

  // Configurar campo de ID geográfico
  series.geoIdField('id');

  // Aplicar cores da propriedade 'fill' no dataset
  series.colorScale(anychart.scales.ordinalColor());
  series.fill(function() {
    return this.get ? this.get("fill") : "#ccc";
  });

  // Mudar a cor ao passar o mouse
  series.hovered().fill("#45a80c");

  // Adicionar tooltips
  series.tooltip().format(function() {
    const stateName = mapStateCodeToName(this.getData('id'));
    return `${stateName}`;
  });

  // Configurar dados geográficos
  map.geoData(anychart.maps.brazil);

  // Configurar container
  map.container('map-container');


  anychart.licenseKey("free");
  map.credits(false);

  // Adicionar labels com siglas dos estados
  series.labels(true);
  series.labels().format(function() {
    return this.getData('id').split('.')[1];
  });
  series.labels().fontSize(12);
  series.labels().fontColor("#000");

  // Desenhar o mapa
  map.draw();
}

// Função para criar gráfico de distribuição por categoria
function createCategoryChart() {
  const chartElement = document.getElementById('licenseChart');
  if (!chartElement) return; // Verifica se o elemento existe
  
  const ctx = chartElement.getContext('2d');

  // Extrair dados para o gráfico
  const labels = Object.keys(categoryStats);
  const data = Object.values(categoryStats);

  // Definir novas cores para o gráfico
  const backgroundColor = ['#f7b563', '#f4d4a3', '#b8d9c8', '#9bb8d3', '#7c91b3'];
  Chart.defaults.plugins.legend.display = false; 

new Chart(ctx, {
  type: 'pie',
  data: {
    labels: labels, 
    datasets: [{
      data: data,
      backgroundColor: backgroundColor,
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: true, 
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1); 
          return `${percentage}%`; 
        },
        color: '#fff', 
        font: {
          weight: 'bold',
          size: 12
        },
        anchor: 'center', 
        align: 'center'
      }
    },
    tooltip: {
      enabled: true 
    }
  },
  plugins: [ChartDataLabels] 
});
}

// Função para mapear departamentos para códigos de estado
function mapDepartmentToStateCode(department) {
  const mapping = {
    'Acre': 'BR.AC',
    'Alagoas': 'BR.AL',
    'Amapá': 'BR.AP',
    'Amazonas': 'BR.AM',
    'Bahia': 'BR.BA',
    'Ceará': 'BR.CE',
    'Distrito Federal': 'BR.DF',
    'Espírito Santo': 'BR.ES',
    'Goiás': 'BR.GO',
    'Maranhão': 'BR.MA',
    'Mato Grosso': 'BR.MT',
    'Mato Grosso do Sul': 'BR.MS',
    'Minas Gerais': 'BR.MG',
    'Pará': 'BR.PA',
    'Paraíba': 'BR.PB',
    'Paraná': 'BR.PR',
    'Pernambuco': 'BR.PE',
    'Piauí': 'BR.PI',
    'Rio de Janeiro': 'BR.RJ',
    'Rio Grande do Norte': 'BR.RN',
    'Rio Grande do Sul': 'BR.RS',
    'Rondônia': 'BR.RO',
    'Roraima': 'BR.RR',
    'Santa Catarina': 'BR.SC',
    'São Paulo': 'BR.SP',
    'Sergipe': 'BR.SE',
    'Tocantins': 'BR.TO'
  };
  
  return mapping[department];
}

// Função para mapear códigos de estado para nomes
function mapStateCodeToName(stateCode) {
  const mapping = {
    'BR.AC': 'Acre',
    'BR.AL': 'Alagoas',
    'BR.AP': 'Amapá',
    'BR.AM': 'Amazonas',
    'BR.BA': 'Bahia',
    'BR.CE': 'Ceará',
    'BR.DF': 'Distrito Federal',
    'BR.ES': 'Espírito Santo',
    'BR.GO': 'Goiás',
    'BR.MA': 'Maranhão',
    'BR.MT': 'Mato Grosso',
    'BR.MS': 'Mato Grosso do Sul',
    'BR.MG': 'Minas Gerais',
    'BR.PA': 'Pará',
    'BR.PB': 'Paraíba',
    'BR.PR': 'Paraná',
    'BR.PE': 'Pernambuco',
    'BR.PI': 'Piauí',
    'BR.RJ': 'Rio de Janeiro',
    'BR.RN': 'Rio Grande do Norte',
    'BR.RS': 'Rio Grande do Sul',
    'BR.RO': 'Rondônia',
    'BR.RR': 'Roraima',
    'BR.SC': 'Santa Catarina',
    'BR.SP': 'São Paulo',
    'BR.SE': 'Sergipe',
    'BR.TO': 'Tocantins'
  };
  
  return mapping[stateCode] || stateCode;
}

// Inicializar os gráficos
function initializeCharts() {
  createBrazilMap();
  createCategoryChart();
}

// Função para mapear categorias para ícones
function getCategoryIcon(category) {
  const icons = {
    'Formação Docente': '<i class="fa-solid fa-user-graduate"></i>',
    'Prática Docente': '<i class="fa-solid fa-chalkboard-user"></i>',
    'Gestão Educacional': '<i class="fa-solid fa-school"></i>',
    'Oferta Educacional': '<i class="fa-solid fa-briefcase"></i>',
    'Conteúdos e Eventos': '<i class="fa-solid fa-shapes"></i>'
  };
  return icons[category] || ''; // Retorna o ícone correspondente ou vazio se não encontrado
}

// Função para carregar os cards de ações
function loadActions() {
  const container = document.getElementById('technologies-container');
  if (!container) return; // Verificar se o container existe
  
  container.innerHTML = ''; // Limpar o container
  
  // Calcular os índices inicial e final para a página atual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredActions.length);
  
  // Exibir as ações da página atual
  for (let i = startIndex; i < endIndex; i++) {
    const action = filteredActions[i];
    const icon = getCategoryIcon(action.categoria);
    const card = document.createElement('div');
    card.className = 'technology-card';
    
    // Ajuste importante aqui: onclick no próprio botão, sem link interno
    card.innerHTML = `
       <div class="technology-content">
        <div class="technology-header">
        </div>
        <p class="titulo-categoria">${icon} ${action.categoria}</p>
        <p class="technology-description"><span class="titulo-descricao">Descrição da ação:</span> ${action.description}</p>
        <span class="technology-category">${action.departamento}</span>
        <button class="technology-button" onclick="viewDetails(${i - startIndex})">
          Detalhamento
        </button>
      </div>
    `;
    container.appendChild(card);
  }
  
  // Atualizar estado dos botões de paginação
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');
  
  if (prevButton) prevButton.disabled = currentPage === 1;
  if (nextButton) nextButton.disabled = currentPage === totalPages;
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPagesEl) totalPagesEl.textContent = totalPages;
}

// Configurar filtros
function setupFilters() {
  // Verificar se estamos na página de ações
  const categoryDropdown = document.querySelector('#dropdown1 + .dropdown__face + .dropdown__items');
  const typeDropdown = document.querySelector('#dropdown2 + .dropdown__face + .dropdown__items');
  const regionDropdown = document.querySelector('#dropdown3 + .dropdown__face + .dropdown__items');
  
  if (!categoryDropdown) return; 
  
  categoryDropdown.innerHTML = '<li>Todos os tipos de categoria</li>';
  Object.keys(categoryStats).forEach(category => {
    categoryDropdown.innerHTML += `<li>${category}</li>`;
  });
  
  // Preencher o dropdown de tecnologias
  typeDropdown.innerHTML = '<li>Todas as tecnologias</li>';
  const uniqueSolutions = [...new Set(actions.map(action => action.solution))]; // Obter soluções únicas
  uniqueSolutions.forEach(solution => {
    if (solution) {
      typeDropdown.innerHTML += `<li>${solution}</li>`;
    }
  });
 
  
  if (regionDropdown) {
    regionDropdown.innerHTML = '<li>Todos os Departamentos</li>';
    Object.keys(regionStats).forEach(region => {
      regionDropdown.innerHTML += `<li>${region}</li>`;
    });
  }
  
  // Adicionar eventos de clique aos itens do dropdown
  document.querySelectorAll('.dropdown__items li').forEach(item => {
    item.addEventListener('click', function() {
      const dropdown = this.closest('.dropdown');
      const text = this.textContent;
      dropdown.querySelector('.dropdown__text').textContent = text;
      dropdown.querySelector('input[type="checkbox"]').checked = false;
      filterActions();
    });
  });
}

// Filtrar ações
function filterActions() {
  const categoryDropdown = document.querySelector('#dropdown1 + .dropdown__face .dropdown__text');
  const typeDropdown = document.querySelector('#dropdown2 + .dropdown__face .dropdown__text');
  const regionDropdown = document.querySelector('#dropdown3 + .dropdown__face .dropdown__text');
  
  if (!categoryDropdown || !typeDropdown || !regionDropdown) return;
  
  const categoryFilter = categoryDropdown.textContent;
  const typeFilter = typeDropdown.textContent;
  const regionFilter = regionDropdown.textContent;
  
  filteredActions = actions.filter(action => {
    // Filtrar por categoria
    if (categoryFilter !== 'Tipos de categoria' && categoryFilter !== 'Todos os tipos de categoria' && categoryFilter !== 'Categoria da ação') {
      if (action.categoria !== categoryFilter) return false;
    }
    
    if (typeFilter !== 'Todas as tecnologias' && typeFilter !== 'Tecnologia utilizada') {
      if (action.solution !== typeFilter) return false;
    }
    
    // Filtrar por região
    if (regionFilter !== 'Departamento Regional' && regionFilter !== 'Todos os Departamentos') {
      if (action.departamento !== regionFilter) return false;
    }
    
    return true;
  });
  
  // Atualizar o total de páginas
  totalPages = Math.ceil(filteredActions.length / itemsPerPage);
  
  // Resetar para a primeira página e atualizar a exibição
  currentPage = 1;
  loadActions();
  
  // Atualizar informações de paginação
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');
  
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPagesEl) totalPagesEl.textContent = totalPages;
}

// Função para ir para a próxima página
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    
    const currentPageEl = document.getElementById('current-page');
    if (currentPageEl) currentPageEl.textContent = currentPage;
    
    loadActions();
    
    // Scroll para o topo da seção de tecnologias
    const techTitle = document.querySelector('.technologies-title');
    if (techTitle) techTitle.scrollIntoView({ behavior: 'smooth' });
  }
}

// Função para ir para a página anterior
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    
    const currentPageEl = document.getElementById('current-page');
    if (currentPageEl) currentPageEl.textContent = currentPage;
    
    loadActions();
    
    // Scroll para o topo da seção de tecnologias
    const techTitle = document.querySelector('.technologies-title');
    if (techTitle) techTitle.scrollIntoView({ behavior: 'smooth' });
  }
}

// Inicialização específica para página de ações
async function initializeActionsPage() {
  // Carregar ações
  actions = await processActions();
  filteredActions = [...actions];
  
  // Calcular o total de páginas
  totalPages = Math.ceil(actions.length / itemsPerPage);
  
  // Calcular estatísticas
  calculateStats();
  
  // Inicializar os gráficos
  initializeCharts();
  
  // Carregar os cards iniciais
  loadActions();
  
  // Configurar filtros
  setupFilters();
  
  // Verificar se os elementos existem antes de adicionar event listeners
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  
  if (prevButton) prevButton.addEventListener('click', prevPage);
  if (nextButton) nextButton.addEventListener('click', nextPage);
  
  // Atualizar informações de paginação
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');
  
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPagesEl) totalPagesEl.textContent = totalPages;
}

// Inicialização específica para página de detalhamento
function initializeDetailsPage() {
  // Recuperar os dados da ação do localStorage
  const actionData = JSON.parse(localStorage.getItem('selectedAction'));
  
  if (actionData) {
    // Atualizar os elementos da página com os dados da ação
    const titleElement = document.getElementById('technology-title');
    if (titleElement) titleElement.textContent = actionData['Descrição da ação com uso de Inteligência Artificial'];
    
    const descriptionElement = document.getElementById('technology-description');
    if (descriptionElement) descriptionElement.textContent = actionData['Metodologia'];
    
    const solutionElement = document.getElementById('technology-solution');
    if (solutionElement) solutionElement.textContent = actionData['Solução utilizada'];
    
    const categoryElement = document.getElementById('technology-category');
    if (categoryElement) categoryElement.textContent = actionData['Categoria'];
    
    // Preencher os campos adicionais
    const departamentoElement = document.getElementById('departamento');
    if (departamentoElement) departamentoElement.textContent = actionData['Departamento Regional'] || 'Não informado';
    
    const unidadeElement = document.getElementById('unidade');
    if (unidadeElement) unidadeElement.textContent = actionData['Unidade Educacional, Segmento ou Área em que a ação foi desenvolvida'] || 'Não informado';
    
    const custosElement = document.getElementById('custos');
    if (custosElement) custosElement.textContent = actionData['Estimativa de custos'] || 'Não informado';
    
    const referenciasElement = document.getElementById('referencias');
    if (referenciasElement) referenciasElement.textContent = actionData['Referências'] || 'Não informado';
    
    const observacoesElement = document.getElementById('observacoes');
    if (observacoesElement) observacoesElement.textContent = actionData['Observações'] || 'Não informado';
    
    const accessLink = document.querySelector('.technology-access-link');
    if (accessLink) {
      accessLink.href = actionData['Link para o site da ferramenta'] || '#';
      accessLink.textContent = 'Acessar Ferramenta';
    }
    
    // Configurar o link do registro da iniciativa, se disponível
    const registroLink = document.getElementById('link-registro');
    if (registroLink) {
      if (actionData['Link do registro da iniciativa']) {
        registroLink.href = actionData['Link do registro da iniciativa'];
        registroLink.style.display = 'inline-block';
      } else {
        registroLink.style.display = 'none';
      }
    }
  } else {
    // Caso não haja dados, exibir uma mensagem de erro
    const titleElement = document.getElementById('technology-title');
    if (titleElement) titleElement.textContent = 'Erro ao carregar os detalhes da ação.';
    
    const infoContainer = document.getElementById('info-container');
    if (infoContainer) infoContainer.innerHTML = '<p>Não foi possível carregar os detalhes desta ação. Por favor, retorne à página anterior e tente novamente.</p>';
  }
}

// Inicialização geral
document.addEventListener('DOMContentLoaded', function() {
  // Verificar em qual página estamos
  const isActionsPage = document.getElementById('technologies-container') !== null;
  const isDetailsPage = document.querySelector('.technology-details-container') !== null;
  
  if (isActionsPage) {
    // Inicializar a página de ações
    initializeActionsPage();
  } else if (isDetailsPage) {
    // Inicializar a página de detalhamento
    initializeDetailsPage();
  }
});

// Expor functions para uso global
window.actions = actions;
window.viewDetails = viewDetails;
window.nextPage = nextPage;
window.prevPage = prevPage;