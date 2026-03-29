package com.smarthealthassistentmedicure.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class Feature(val name: String, val icon: ImageVector, val color: androidx.compose.ui.graphics.Color)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen() {
    val features = listOf(
        Feature("Disease Predictor", Icons.Default.Search, MaterialTheme.colorScheme.primary),
        Feature("Medicine Scanner", Icons.Default.AddCircle, MaterialTheme.colorScheme.secondary),
        Feature("Report Analyzer", Icons.Default.Info, MaterialTheme.colorScheme.tertiary),
        Feature("Skin Check", Icons.Default.Face, MaterialTheme.colorScheme.error),
        Feature("Doctors", Icons.Default.Person, MaterialTheme.colorScheme.primary),
        Feature("Ambulance", Icons.Default.Call, MaterialTheme.colorScheme.secondary)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Medicure - Smart Health", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "Welcome, User!",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Text(
                text = "How can we help you today?",
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(features) { feature ->
                    FeatureCard(feature)
                }
            }
        }
    }
}

@Composable
fun FeatureCard(feature: Feature) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
            .clickable { /* Navigate to feature */ },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = feature.icon,
                contentDescription = feature.name,
                modifier = Modifier.size(48.dp),
                tint = feature.color
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = feature.name,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}
