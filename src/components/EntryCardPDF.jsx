import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// স্টাইল (আপনার আগের CSS এর মতো)
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 12 },
  card: { border: '2px solid #333', borderRadius: 10, paddingBottom: 10 },
  header: { backgroundColor: '#f0f0f0', padding: 10, textAlign: 'center', borderBottom: '1px solid #ccc' },
  title: { fontSize: 24, marginBottom: 5 },
  subtitle: { fontSize: 16 },
  row: { flexDirection: 'row', padding: 15 },
  qrCol: { width: '35%', alignItems: 'center' },
  qrImage: { width: 120, height: 120 },
  detailsCol: { width: '65%', paddingLeft: 15 },
  label: { fontWeight: 'bold', fontSize: 10, color: '#555' },
  value: { marginBottom: 5 },
  divider: { borderBottom: '2px dashed #777', marginVertical: 15, marginHorizontal: 15, textAlign: 'center', padding: 5 },
  cutText: { fontSize: 10, color: '#555', textAlign: 'center' },
  part2: { backgroundColor: '#f9f9f9', padding: 15 },
  redId: { color: '#D90000', fontSize: 14, fontWeight: 'bold' }
});

// এই ফাংশনটি QR কোড জেনারেট করে
const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    return null;
  }
};

// মেইন PDF ডকুমেন্ট
export const EntryCardDocument = ({ data, qrCodeUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.card}>
        
        {/* Part 1: Entry */}
        <View style={styles.header}>
          <Text style={styles.title}>Family Annual Event</Text>
          <Text style={styles.subtitle}>Entry Card</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.qrCol}>
            {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrImage} />}
            <Text style={{ fontSize: 10, marginTop: 5 }}>Scan upon entry</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Registration ID:</Text>
            <Text style={[styles.value, styles.redId]}>{data.id}</Text>
            
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.name}</Text>
            
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.value}>{data.mobile}</Text>
            
            <Text style={styles.label}>Total Members:</Text>
            <Text style={styles.value}>{data.totalMembers}</Text>

            <Text style={styles.label}>Payment Status:</Text>
            <Text style={{ color: 'green', fontWeight: 'bold' }}>{data.paymentStatus}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <Text style={styles.cutText}>-- Cut here and submit for food --</Text>
        </View>

        {/* Part 2: Food Coupon */}
        <View style={styles.part2}>
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 10 }]}>Food Coupon</Text>
          <Text style={styles.label}>Registration ID: <Text style={styles.redId}>{data.id}</Text></Text>
          <Text style={styles.label}>Name: {data.name}</Text>
          <Text style={[styles.label, { marginTop: 10, textAlign: 'center', fontSize: 14 }]}>
            Total Members: {data.totalMembers}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);