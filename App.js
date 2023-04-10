import { StyleSheet, Alert, Text, ScrollView, TextInput, Pressable, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import React, { Component, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from "expo-sqlite";

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => { },
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function BmiDB({ bmiCalc }) {
  if (bmiCalc === null || bmiCalc.length === 0) {
    return null;
  }

  return (
    <ScrollView>
      <Text style={styles.history}> BMI History </Text>
      {bmiCalc.map(({ id, weight, height, bmi, logDate }) => (
        <Text key={id} style={styles.historyText}>
          {logDate}:&nbsp;&nbsp; {bmi.toFixed(1)} (W:{weight}, H:{height})
        </Text>
      ))}
    </ScrollView>
  )
}

export default function App() {
  const [results, setResults] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiData, setBmiData] = useState([]);

  const setupDB = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists bmiCalc (id integer primary key not null, weight int, height int, bmi int, logDate real);",
      );
    });
  }

  const fetchHistory = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'select id, weight, height, bmi, date(logDate) as logDate from bmiCalc order by logDate desc', [],
        (_, { rows: { _array } }) => {
          setBmiData(_array)
        },
        (_, error) => {
          console.log("fetchHistory Error: ", error)
        }
      );
    });
  }

  useEffect(() => {
    if (db === null) {
      return
    }

    setupDB();
    fetchHistory();
  }, [results, db])

  onSave = async () => {
    const bmi = (weight / (height * height)) * 703;

    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists bmiCalc (id integer primary key not null, weight int, height int, bmi int, logDate real);"
      );
      tx.executeSql("insert into bmiCalc (weight, height, bmi, logDate) values (?, ?, ?, julianday('now'))", [weight, height, bmi]);
    });

    let results = "Body Mass Index is " + bmi.toFixed(1);

    if (bmi < 18.5) {
      results += "\n (Underweight)";
    } else if (bmi >= 18.5 & bmi <= 24.9) {
      results += "\n (Healthy)";
    } else if (bmi >= 25.0 & bmi <= 29.9) {
      results += "\n (Overweight)";
    } else {
      results += "\n (Obese)";
    }

    setResults(results);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>
      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          onChangeText={(val) => setWeight(val)}
          value={weight}
          placeholder="Weight in Pounds"
        />
        <TextInput
          style={styles.input}
          onChangeText={(val) => setHeight(val)}
          value={height}
          placeholder="Height in Inches"
        />
        <Pressable onPress={this.onSave} style={styles.button}>
          <Text style={styles.buttonText}>Compute BMI</Text>
        </Pressable>
        <TextInput
          style={styles.bmi}
          value={results}
          editable={false}
          multiline
        />
        <BmiDB bmiCalc={bmiData} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    paddingTop: 50,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  bmi: {
    flex: 1,
    fontSize: 28,
    textAlign: 'center',
    padding: 15,
    paddingBottom: 35,
    color: '#000'
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
    fontSize: 24,
  },
  button: {
    backgroundColor: '#34495e',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  history: {
    flex: 1,
    fontSize: 24,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 20,
  }
});
