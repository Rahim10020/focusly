# Analyse: Dashboard Analytique

**Fichier principal:** `src/app/dashboard/page.tsx` (320 lignes)

## 📋 Description de la Fonctionnalité

Le dashboard analytique fournit une vue complète des performances et de la productivité de l'utilisateur. Fonctionnalités principales :
- Statistiques détaillées (tâches totales, complétées, taux de complétion, streaks)
- Graphiques de productivité sur 7 et 30 jours
- Évolution de la productivité par domaine de vie
- Section insights et recommandations
- Export multi-formats (CSV, PDF, iCal)

**Composants utilisés:**
- `AdvancedProductivityChart` (lazy loaded)
- `DomainEvolutionChart` (lazy loaded)

**Technologies:**
- Recharts pour les graphiques
- jsPDF pour l'export PDF
- ics pour l'export calendrier

## 🐛 Problèmes Identifiés

### 1. **Insights Statiques Non Dynamiques**
**Sévérité:** Haute
**Localisation:** `src/app/dashboard/page.tsx` - Section insights

**Description:**
Les insights et recommandations affichés sont statiques et ne changent pas en fonction des vraies données de l'utilisateur. Le texte est hardcodé et ne reflète pas la réalité des statistiques.

```typescript
// Exemple de code actuel (hardcodé)
const insights = [
  "Votre productivité a augmenté de 15% cette semaine",
  "Vous êtes plus productif en matinée",
  "Essayez de maintenir votre streak actuel"
];
```

**Impact:**
- Perte de crédibilité de l'application
- Insights non pertinents pour l'utilisateur
- Manque de valeur ajoutée de la section analytics

---

### 2. **Graphiques Sans Interactions Avancées**
**Sévérité:** Moyenne
**Localisation:** Composants de graphiques

**Description:**
Les graphiques (AdvancedProductivityChart, DomainEvolutionChart) ne permettent pas :
- Zoom sur une période spécifique
- Export du graphique en image
- Drill-down dans les données
- Comparaison de périodes

**Impact:**
- Analyse limitée des données
- Manque de flexibilité pour l'utilisateur
- Expérience utilisateur basique

---

### 3. **Export PDF Limité et Non Flexible**
**Sévérité:** Moyenne
**Localisation:** Fonctions d'export PDF

**Description:**
L'export PDF exporte tout le dashboard sans permettre de choisir les sections spécifiques à inclure. Le format est également figé.

```typescript
// Code actuel - pas de personnalisation
const exportPDF = () => {
  // Exporte tout sans choix
  const doc = new jsPDF();
  // ... génération complète
};
```

**Impact:**
- PDFs volumineux et non ciblés
- Gaspillage de ressources
- Manque de flexibilité

---

### 4. **Pas de Comparaison de Périodes**
**Sévérité:** Moyenne
**Localisation:** Vue d'ensemble du dashboard

**Description:**
Impossible de comparer la productivité entre deux périodes différentes (ex: cette semaine vs semaine dernière, ce mois vs mois dernier).

**Impact:**
- Analyse de tendances limitée
- Difficulté à mesurer les progrès
- Insights moins riches

---

### 5. **Sélecteur de Plage Temporelle Limité**
**Sévérité:** Faible
**Localisation:** Sélecteur 7 ou 30 jours

**Description:**
Seulement 2 options disponibles (7 ou 30 jours). Pas de plages personnalisées, de vue mensuelle, annuelle, etc.

**Impact:**
- Flexibilité limitée pour l'analyse
- Cas d'usage non couverts

---

## 💡 Propositions de Corrections et Améliorations

### Correction 1: Implémenter des Insights Dynamiques

**Priorité:** Haute
**Difficulté:** Haute

**Solution proposée:**
```typescript
// Créer un moteur d'insights dynamiques
const generateDynamicInsights = (stats, sessions, tasks) => {
  const insights = [];

  // Insight 1: Tendance de productivité
  const thisWeekFocus = getWeekFocusTime(sessions, 0);
  const lastWeekFocus = getWeekFocusTime(sessions, 1);
  const percentChange = ((thisWeekFocus - lastWeekFocus) / lastWeekFocus) * 100;

  if (percentChange > 10) {
    insights.push({
      type: 'positive',
      title: 'Excellent progrès!',
      message: `Votre temps de focus a augmenté de ${percentChange.toFixed(1)}% cette semaine`,
      icon: '📈'
    });
  } else if (percentChange < -10) {
    insights.push({
      type: 'warning',
      title: 'Attention',
      message: `Votre temps de focus a diminué de ${Math.abs(percentChange).toFixed(1)}% cette semaine`,
      icon: '⚠️',
      suggestion: 'Essayez de planifier des sessions plus régulières'
    });
  }

  // Insight 2: Meilleur moment de productivité
  const hourlyProductivity = analyzeProductivityByHour(sessions);
  const bestHour = hourlyProductivity.reduce((max, curr) =>
    curr.focusTime > max.focusTime ? curr : max
  );

  insights.push({
    type: 'info',
    title: 'Votre pic de productivité',
    message: `Vous êtes plus productif vers ${bestHour.hour}h`,
    icon: '⏰',
    suggestion: 'Planifiez vos tâches importantes à cette heure'
  });

  // Insight 3: Streak analysis
  if (stats.streak >= 7) {
    insights.push({
      type: 'achievement',
      title: 'Streak impressionnant!',
      message: `${stats.streak} jours consécutifs! Continuez!`,
      icon: '🔥'
    });
  } else if (stats.streak === 0 && stats.longestStreak > 0) {
    insights.push({
      type: 'warning',
      title: 'Streak perdu',
      message: `Votre plus long streak était de ${stats.longestStreak} jours`,
      icon: '💔',
      suggestion: 'Commencez un nouveau streak aujourd\'hui!'
    });
  }

  // Insight 4: Domaine négligé
  const domainStats = analyzeDomainDistribution(tasks);
  const neglectedDomain = domainStats.find(d => d.percentage < 10);

  if (neglectedDomain) {
    insights.push({
      type: 'info',
      title: 'Domaine négligé',
      message: `Seulement ${neglectedDomain.percentage}% de vos tâches concernent ${neglectedDomain.name}`,
      icon: '⚖️',
      suggestion: 'Pensez à équilibrer vos domaines de vie'
    });
  }

  // Insight 5: Taux de complétion
  const completionRate = (stats.completedTasks / stats.totalTasks) * 100;

  if (completionRate > 80) {
    insights.push({
      type: 'positive',
      title: 'Taux de complétion excellent',
      message: `Vous complétez ${completionRate.toFixed(1)}% de vos tâches`,
      icon: '🎯'
    });
  } else if (completionRate < 50) {
    insights.push({
      type: 'warning',
      title: 'Taux de complétion faible',
      message: `Seulement ${completionRate.toFixed(1)}% de vos tâches sont complétées`,
      icon: '📉',
      suggestion: 'Définissez des objectifs plus réalistes ou réduisez le nombre de tâches'
    });
  }

  return insights;
};

// Utilisation dans le composant
const insights = useMemo(() =>
  generateDynamicInsights(stats, sessions, tasks),
  [stats, sessions, tasks]
);
```

**Bénéfices:**
- Insights pertinents et personnalisés
- Valeur ajoutée réelle pour l'utilisateur
- Engagement accru

---

### Amélioration 2: Ajouter des Interactions Avancées aux Graphiques

**Priorité:** Moyenne
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Dans AdvancedProductivityChart.tsx
import { Brush, ReferenceLine } from 'recharts';

const AdvancedProductivityChart = ({ data, timeRange }) => {
  const [zoomDomain, setZoomDomain] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleZoom = (domain) => {
    setZoomDomain(domain);
  };

  const exportChart = () => {
    // Utiliser html2canvas pour exporter
    const chartElement = chartRef.current;
    html2canvas(chartElement).then(canvas => {
      const link = document.createElement('a');
      link.download = `productivite-${new Date().toISOString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div>
      <div className="chart-controls">
        <Button onClick={() => setShowComparison(!showComparison)}>
          {showComparison ? 'Masquer' : 'Afficher'} comparaison
        </Button>
        <Button onClick={exportChart}>
          Exporter en image
        </Button>
        <Button onClick={() => setZoomDomain(null)}>
          Réinitialiser zoom
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} ref={chartRef}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" domain={zoomDomain || ['auto', 'auto']} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Données actuelles */}
          <Line
            type="monotone"
            dataKey="focusTime"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />

          {/* Données de comparaison */}
          {showComparison && (
            <Line
              type="monotone"
              dataKey="previousPeriodFocusTime"
              stroke="#82ca9d"
              strokeDasharray="5 5"
              name="Période précédente"
            />
          )}

          {/* Brush pour zoomer */}
          <Brush
            dataKey="date"
            height={30}
            stroke="#8884d8"
            onChange={handleZoom}
          />

          {/* Ligne de référence (moyenne) */}
          <ReferenceLine
            y={calculateAverage(data)}
            label="Moyenne"
            stroke="red"
            strokeDasharray="3 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Tooltip personnalisé avec drill-down
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label}`}</p>
        <p className="value">{`Temps focus: ${formatTime(payload[0].value)}`}</p>
        <p className="detail">{`Sessions: ${payload[0].payload.sessions}`}</p>
        <p className="detail">{`Tâches: ${payload[0].payload.completedTasks}`}</p>
        <Button size="sm" onClick={() => drillDown(label)}>
          Voir détails
        </Button>
      </div>
    );
  }
  return null;
};
```

**Bénéfices:**
- Analyse approfondie possible
- Export facile des graphiques
- Comparaisons visuelles
- Meilleure compréhension des données

---

### Amélioration 3: Export PDF Personnalisable

**Priorité:** Moyenne
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
const [exportOptions, setExportOptions] = useState({
  includeStats: true,
  includeCharts: true,
  includeInsights: true,
  includeTasks: false,
  timeRange: '30days',
  format: 'detailed' // ou 'summary'
});

const [showExportModal, setShowExportModal] = useState(false);

const exportCustomPDF = async () => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text('Rapport de Productivité Focusly', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`Période: ${formatDateRange(exportOptions.timeRange)}`, 20, yPosition);
  doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 150, yPosition);
  yPosition += 15;

  // Stats si sélectionné
  if (exportOptions.includeStats) {
    doc.setFontSize(16);
    doc.text('Statistiques', 20, yPosition);
    yPosition += 10;

    const statsData = [
      ['Métrique', 'Valeur'],
      ['Sessions totales', stats.totalSessions],
      ['Tâches complétées', stats.completedTasks],
      ['Temps focus total', formatTime(stats.totalFocusTime)],
      ['Streak actuel', `${stats.streak} jours`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [statsData[0]],
      body: statsData.slice(1),
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Charts si sélectionné
  if (exportOptions.includeCharts) {
    // Convertir le chart en image et l'ajouter
    const chartCanvas = await html2canvas(chartRef.current);
    const chartImage = chartCanvas.toDataURL('image/png');

    doc.addPage();
    doc.text('Graphique de Productivité', 20, 20);
    doc.addImage(chartImage, 'PNG', 20, 30, 170, 100);
  }

  // Insights si sélectionné
  if (exportOptions.includeInsights) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Insights et Recommandations', 20, 20);
    yPosition = 35;

    insights.forEach((insight, index) => {
      doc.setFontSize(12);
      doc.text(`${insight.icon} ${insight.title}`, 20, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.text(insight.message, 25, yPosition);
      yPosition += 5;

      if (insight.suggestion) {
        doc.setTextColor(100, 100, 100);
        doc.text(`→ ${insight.suggestion}`, 25, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 5;
      }

      yPosition += 5;
    });
  }

  // Save
  doc.save(`focusly-rapport-${Date.now()}.pdf`);
};

// Modal de personnalisation
const ExportModal = () => (
  <Modal open={showExportModal} onClose={() => setShowExportModal(false)}>
    <h2>Personnaliser l'export PDF</h2>

    <div className="export-options">
      <label>
        <input
          type="checkbox"
          checked={exportOptions.includeStats}
          onChange={e => setExportOptions({...exportOptions, includeStats: e.target.checked})}
        />
        Inclure les statistiques
      </label>

      <label>
        <input
          type="checkbox"
          checked={exportOptions.includeCharts}
          onChange={e => setExportOptions({...exportOptions, includeCharts: e.target.checked})}
        />
        Inclure les graphiques
      </label>

      <label>
        <input
          type="checkbox"
          checked={exportOptions.includeInsights}
          onChange={e => setExportOptions({...exportOptions, includeInsights: e.target.checked})}
        />
        Inclure les insights
      </label>

      <label>
        Plage temporelle:
        <select
          value={exportOptions.timeRange}
          onChange={e => setExportOptions({...exportOptions, timeRange: e.target.value})}
        >
          <option value="7days">7 derniers jours</option>
          <option value="30days">30 derniers jours</option>
          <option value="thisMonth">Ce mois</option>
          <option value="lastMonth">Mois dernier</option>
          <option value="custom">Personnalisé</option>
        </select>
      </label>
    </div>

    <Button onClick={exportCustomPDF}>Générer PDF</Button>
  </Modal>
);
```

**Bénéfices:**
- Rapports ciblés et pertinents
- Réduction de la taille des PDFs
- Flexibilité maximale

---

### Amélioration 4: Ajouter une Heatmap de Productivité

**Priorité:** Moyenne
**Difficulté:** Haute

**Solution proposée:**
```typescript
// Nouveau composant ProductivityHeatmap
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

const ProductivityHeatmap = ({ sessions }) => {
  // Transformer les sessions en données heatmap
  const heatmapData = useMemo(() => {
    const data = [];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Créer une matrice heure x jour
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const sessionsAtTime = sessions.filter(s => {
          const date = new Date(s.started_at);
          return date.getDay() === day && date.getHours() === hour;
        });

        const totalTime = sessionsAtTime.reduce((sum, s) => sum + s.duration, 0);

        data.push({
          day: days[day],
          hour,
          value: totalTime,
          sessions: sessionsAtTime.length
        });
      }
    }

    return data;
  }, [sessions]);

  // Couleur basée sur l'intensité
  const getColor = (value) => {
    const max = Math.max(...heatmapData.map(d => d.value));
    const intensity = value / max;

    if (intensity > 0.8) return '#196127';
    if (intensity > 0.6) return '#239a3b';
    if (intensity > 0.4) return '#7bc96f';
    if (intensity > 0.2) return '#c6e48b';
    if (intensity > 0) return '#ebedf0';
    return '#f0f0f0';
  };

  return (
    <div className="heatmap-container">
      <h3>Heatmap de productivité (style GitHub)</h3>
      <div className="heatmap-grid">
        {heatmapData.map((cell, index) => (
          <div
            key={index}
            className="heatmap-cell"
            style={{ backgroundColor: getColor(cell.value) }}
            title={`${cell.day} ${cell.hour}h: ${formatTime(cell.value)} (${cell.sessions} sessions)`}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Moins</span>
        <div style={{ backgroundColor: '#ebedf0' }} />
        <div style={{ backgroundColor: '#c6e48b' }} />
        <div style={{ backgroundColor: '#7bc96f' }} />
        <div style={{ backgroundColor: '#239a3b' }} />
        <div style={{ backgroundColor: '#196127' }} />
        <span>Plus</span>
      </div>
    </div>
  );
};
```

**CSS associé:**
```css
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(24, 12px);
  grid-template-rows: repeat(7, 12px);
  gap: 2px;
  margin: 20px 0;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.5);
  z-index: 10;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.heatmap-legend div {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
```

**Bénéfices:**
- Visualisation puissante des patterns
- Identification rapide des moments productifs
- Interface familière (style GitHub)

---

## 📊 Métriques de Succès

1. **Qualité des Insights:**
   - Taux de pertinence > 85% (feedback utilisateur)
   - Diversité des insights > 5 types différents

2. **Utilisation:**
   - Taux d'export PDF +40%
   - Temps passé sur dashboard +50%
   - Interactions avec graphiques +60%

3. **Performance:**
   - Génération des insights < 500ms
   - Rendu des graphiques < 1s
   - Export PDF < 3s

---

## 🔗 Fichiers Connexes

- `src/components/stats/AdvancedProductivityChart.tsx`
- `src/components/stats/DomainEvolutionChart.tsx`
- `src/lib/utils/exportUtils.ts`
- `src/lib/hooks/useStats.ts`

---

**Dernière mise à jour:** 2025-11-29
**Priorité globale:** Haute
**Effort estimé:** 4-5 jours de développement
