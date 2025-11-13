import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// ১. বাংলা ফন্ট রেজিস্টার করা (public ফোল্ডার থেকে)
Font.register({
  family: 'Kalpurush',
  src: '/fonts/Kalpurush.ttf', // আপনার public ফোল্ডারের পাথ
});

// ২. স্টাইল আপডেট (fontFamily: 'Kalpurush' যোগ করা হয়েছে)
const styles = StyleSheet.create({
  page: { 
    padding: 20, 
    fontFamily: 'Kalpurush', // <--- এখানে বাংলা ফন্ট সেট করা হলো
    fontSize: 12 
  },
  card: { 
    border: '2px solid #333', 
    borderRadius: 10, 
    paddingBottom: 10 
  },
  header: { 
    backgroundColor: '#f0f0f0', 
    padding: 10, 
    textAlign: 'center', 
    borderBottom: '1px solid #ccc' 
  },
  title: { 
    fontSize: 24, 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 16 
  },
  row: { 
    flexDirection: 'row', 
    padding: 15 
  },
  qrCol: { 
    width: '35%', 
    alignItems: 'center' 
  },
  qrImage: { 
    width: 120, 
    height: 120 
  },
  detailsCol: { 
    width: '65%', 
    paddingLeft: 15 
  },
  // লেবেলের স্টাইল
  labelRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  label: { 
    fontWeight: 'bold', 
    fontSize: 11, 
    color: '#555',
    width: 100 
  },
  value: { 
    fontSize: 12,
    flex: 1
  },
  divider: { 
    borderBottom: '2px dashed #777', 
    marginVertical: 15, 
    marginHorizontal: 15, 
    textAlign: 'center', 
    padding: 5 
  },
  cutText: { 
    fontSize: 10, 
    color: '#555', 
    textAlign: 'center' 
  },
  part2: { 
    backgroundColor: '#f9f9f9', 
    padding: 15 
  },
  redId: { 
    color: '#D90000', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  statusPaid: {
    color: 'green', 
    fontWeight: 'bold'
  },
  statusPending: {
    color: '#d97706', 
    fontWeight: 'bold'
  }
});

// মেইন PDF ডকুমেন্ট
export const EntryCardDocument = ({ data, qrCodeUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.card}>
        
        {/* ============ পার্ট ১: এন্ট্রি কার্ড ============ */}
        <View style={styles.header}>
          <Text style={styles.title}>হরকরা ফাউন্ডেশন (ডেমো)</Text>
          <Text style={styles.subtitle}>প্রবেশ পত্র (Entry Card)</Text>
        </View>

        <View style={styles.row}>
          {/* QR কোড সেকশন */}
          <View style={styles.qrCol}>
            {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrImage} />}
            <Text style={{ fontSize: 10, marginTop: 5 }}>প্রবেশের সময় স্ক্যান করুন</Text>
          </View>

          {/* তথ্য সেকশন */}
          <View style={styles.detailsCol}>
            
            <View style={styles.labelRow}>
              <Text style={styles.label}>রেজিস্ট্রেশন আইডি:</Text>
              <Text style={[styles.value, styles.redId]}>{data.id}</Text>
            </View>
            
            <View style={styles.labelRow}>
              <Text style={styles.label}>নাম:</Text>
              <Text style={styles.value}>{data.name}</Text>
            </View>
            
            <View style={styles.labelRow}>
              <Text style={styles.label}>মোবাইল:</Text>
              <Text style={styles.value}>{data.mobile}</Text>
            </View>
            
            <View style={styles.labelRow}>
              <Text style={styles.label}>মোট সদস্য:</Text>
              <Text style={styles.value}>{data.totalMembers} জন</Text>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>পেমেন্ট স্ট্যাটাস:</Text>
              <Text style={[styles.value, data.paymentStatus === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                {data.paymentStatus === 'Paid' ? 'পরিশোধিত' : 'মুলতবি'}
              </Text>
            </View>

          </View>
        </View>

        {/* ডিভাইডার / কাটার জায়গা */}
        <View style={styles.divider}>
          <Text style={styles.cutText}>-- ✂️ খাবার সংগ্রহের জন্য এই অংশটি কেটে জমা দিন --</Text>
        </View>

        {/* ============ পার্ট ২: খাবার কুপন ============ */}
        <View style={styles.part2}>
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 10 }]}>খাবার কুপন (Food Coupon)</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
            <View>
                <Text style={{ fontSize: 11, color: '#555' }}>রেজিস্ট্রেশন আইডি:</Text>
                <Text style={styles.redId}>{data.id}</Text>
            </View>
            <View>
                <Text style={{ fontSize: 11, color: '#555' }}>নাম:</Text>
                <Text style={{ fontSize: 12 }}>{data.name}</Text>
            </View>
          </View>

          <Text style={{ marginTop: 15, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
            মোট সদস্য: {data.totalMembers} জন
          </Text>
        </View>

      </View>
    </Page>
  </Document>
);