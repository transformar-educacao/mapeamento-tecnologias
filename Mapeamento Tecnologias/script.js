// Função para buscar e carregar os dados do JSON
async function loadData() {
  try {
    const response = await fetch('MapeamentoIA.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
    return [];
  }
}

// Registrar plugin para legendas
Chart.register(ChartDataLabels);

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

// Processa os dados para criar um objeto de tecnologias únicas
async function processTechnologies() {
  const rawData = await loadData();
  const technologiesMap = new Map();
  
  // Processa os dados para criar tecnologias únicas
  rawData.forEach(item => {
    const techName = item["Inteligência Artificial"];
    
    if (!technologiesMap.has(techName)) {
      const faviconUrl = getFaviconUrl(item["Link"]);

      technologiesMap.set(techName, {
        id: technologiesMap.size + 1,
        name: techName,
        description: item["Descrição da Inteligência Artificial"],
        fullDescription: item["Descrição da Inteligência Artificial"],
        license: item["Licença"],
        tipo: item["Subcategoria da Ferramenta"], 
        url: item["Link"], 
        image: faviconUrl,
        testimonials: []
      });
    }
    
    // Adiciona o depoimento para esta tecnologia
    if (item["Casos de Uso"] && item["Casos de Uso"].trim() !== "") {
      technologiesMap.get(techName).testimonials.push({
        name: `Departamento Regional ${item["Departamento Regional"]}`,
        department: item["Departamento Regional"],
        content: item["Casos de Uso"],
        category: item["Categoria"],
        date: "2023" // Data padrão ou você pode extrair do JSON se disponível
      });
    }
  });
  
  // Converter o Map para um array
  return Array.from(technologiesMap.values());
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
let technologies = [];
let currentPage = 1;
const itemsPerPage = 9;
let filteredTechnologies = [];
let totalPages = 1;

// Variáveis para armazenar estatísticas
let licenseStats = {};
let typeStats = {};
let regionStats = {};

// Função para calcular estatísticas
function calculateStats() {
  licenseStats = {};
  typeStats = {};
  regionStats = {};
  
  technologies.forEach(tech => {
    // Estatísticas de licença
    licenseStats[tech.license] = (licenseStats[tech.license] || 0) + 1;
    
    // Estatísticas de tipo
    typeStats[tech.tipo] = (typeStats[tech.tipo] || 0) + 1;
    
    // Estatísticas de região
    tech.testimonials.forEach(testimonial => {
      const region = testimonial.department;
      regionStats[region] = (regionStats[region] || 0) + 1;
    });
  });
}

// Analisar dados de licença para o gráfico
function analyzeLicenseData() {
  return {
    labels: Object.keys(licenseStats),
    data: Object.values(licenseStats)
  };
}

// Analisar dados de tipo para o gráfico
function analyzeTypeData() {
  return {
    labels: Object.keys(typeStats),
    data: Object.values(typeStats)
  };
}

// Criar gráfico de pizza para licenças
function createLicenseChart(data) {
  const ctx = document.getElementById('licenseChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Distribuição por licença',
        data: data.data,
        backgroundColor: [
          'rgba(0, 74, 141, 1)', 
          'rgba(253, 193, 128, 1)',
          'rgba(247, 148, 29, 1)',
        ],
        borderColor: [
          'rgba(0, 74, 141, 1)',
          'rgba(253, 193, 128, 1)',
          'rgba(247, 148, 29, 1)', 
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw || 0;
              return `${value}`;
            }
          }
        },
        datalabels: {
          display: true,
          color: 'white',
          formatter: (value, context) => {
            return value;
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Criar gráfico de barras para tipos
function createTypeChart(data) {
  const ctx = document.getElementById('typeChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Número de ferramentas',
        data: data.data,
        backgroundColor: 'rgba(247, 148, 29, 1)',
        borderColor: 'rgba(247, 148, 29, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y', 
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false,
          text: 'Distribuição por tipo de ferramenta'
        },
        datalabels:{
          display: false
        }
      }
    }
  });
}

// Inicializar os gráficos
function initializeCharts() {
  // Análise dos dados para o gráfico de licença
  const licenseData = analyzeLicenseData();
  createLicenseChart(licenseData);
  
  // Análise dos dados para o gráfico de tipo
  const typeData = analyzeTypeData();
  createTypeChart(typeData);
}

// Função para carregar os cards de tecnologias
function loadTechnologies() {
  const container = document.getElementById('technologies-container');
  container.innerHTML = ''; // Limpar o container
  
  // Calcular os índices inicial e final para a página atual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTechnologies.length);
  
  // Exibir as tecnologias da página atual
  for (let i = startIndex; i < endIndex; i++) {
    const tech = filteredTechnologies[i];
    const card = document.createElement('div');
    card.className = 'technology-card';
    card.innerHTML = `
      <div class="technology-content">
        <div class="technology-header">
          <img src="${tech.image}" alt="${tech.name}" class="technology-image" 
            onerror="this.onerror=null; this.src='/images/default-icon.png';">
          <h3 class="technology-title">${tech.name}</h3>
        </div>
        <p class="technology-description">${tech.description}</p>
        <span class="technology-category">${tech.license}</span>
        <span class="technology-category">${tech.tipo}</span>
        <a href="tecnologia.html?id=${tech.id}" class="technology-button"> <i class="fa-solid fa-comments"></i> Experiências com a tecnologia</a>
      </div>
    `;
    container.appendChild(card);
  }
  
  // Atualizar estado dos botões de paginação
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Configurar filtros
function setupFilters() {
  // Preencher os dropdowns com opções baseadas nos dados
  const licenseDropdown = document.querySelector('#dropdown1 + .dropdown__face + .dropdown__items');
  const typeDropdown = document.querySelector('#dropdown2 + .dropdown__face + .dropdown__items');
  const regionDropdown = document.querySelector('#dropdown3 + .dropdown__face + .dropdown__items');
  
  if (licenseDropdown) {
    licenseDropdown.innerHTML = '<li>Todos os tipos de licença</li>';
    Object.keys(licenseStats).forEach(license => {
      licenseDropdown.innerHTML += `<li>${license}</li>`;
    });
  }
  
  if (typeDropdown) {
    typeDropdown.innerHTML = '<li>Todos os tipos</li>';
    Object.keys(typeStats).forEach(type => {
      typeDropdown.innerHTML += `<li>${type}</li>`;
    });
  }
  
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
      filterTechnologies();
    });
  });
}

// Filtrar tecnologias
function filterTechnologies() {
  const licenseFilter = document.querySelector('#dropdown1 + .dropdown__face .dropdown__text').textContent;
  const typeFilter = document.querySelector('#dropdown2 + .dropdown__face .dropdown__text').textContent;
  const regionFilter = document.querySelector('#dropdown3 + .dropdown__face .dropdown__text').textContent;
  
  filteredTechnologies = technologies.filter(tech => {
    // Filtrar por licença
    if (licenseFilter !== 'Tipos de licença' && licenseFilter !== 'Todos os tipos de licença') {
      if (tech.license !== licenseFilter) return false;
    }
    
    // Filtrar por tipo
    if (typeFilter !== 'Tipos de Ferramenta' && typeFilter !== 'Todos os tipos') {
      if (tech.tipo !== typeFilter) return false;
    }
    
    // Filtrar por região
    if (regionFilter !== 'Experiências por Departamento Regional' && regionFilter !== 'Todos os Departamentos') {
      const hasRegion = tech.testimonials.some(t => t.department === regionFilter);
      if (!hasRegion) return false;
    }
    
    return true;
  });
  
  // Atualizar o total de páginas
  totalPages = Math.ceil(filteredTechnologies.length / itemsPerPage);
  
  // Resetar para a primeira página e atualizar a exibição
  currentPage = 1;
  loadTechnologies();
  
  // Atualizar informações de paginação
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages;
}

// Função para ir para a próxima página
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    document.getElementById('current-page').textContent = currentPage;
    loadTechnologies();
    
    // Scroll para o topo da seção de tecnologias
    document.querySelector('.technologies-title').scrollIntoView({ behavior: 'smooth' });
  }
}

// Função para ir para a página anterior
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    document.getElementById('current-page').textContent = currentPage;
    loadTechnologies();
    
    // Scroll para o topo da seção de tecnologias
    document.querySelector('.technologies-title').scrollIntoView({ behavior: 'smooth' });
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  // Carregar tecnologias
  technologies = await processTechnologies();
  filteredTechnologies = [...technologies];
  
  // Calcular o total de páginas
  totalPages = Math.ceil(technologies.length / itemsPerPage);
  
  // Atualizar as informações de paginação
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages;
  
  // Calcular estatísticas
  calculateStats();
  
  // Inicializar os gráficos
  initializeCharts();
  
  // Carregar os cards iniciais
  loadTechnologies();
  
  // Adicionar eventos aos botões de paginação
  document.getElementById('prev-page').addEventListener('click', prevPage);
  document.getElementById('next-page').addEventListener('click', nextPage);
  
  // Configurar filtros
  setupFilters();
  

});

// Expor technologies para uso em tecnologia.html
window.technologies = technologies;