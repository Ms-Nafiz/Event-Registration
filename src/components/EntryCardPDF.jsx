import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, Link } from '@react-pdf/renderer';

// ১. বাংলা ফন্ট রেজিস্টার (আগের মতোই)
Font.register({
  family: 'Kalpurush',
  src: '/fonts/Kalpurush.ttf',
});

// ২. ইভেন্টের তথ্য (এখানে আপনার তথ্য দিন)
const EVENT_DETAILS = {
  title: "বার্ষিক বংশ মিলনমেলা ২০২৫",
  date: "শুক্রবার, ২৫ ডিসেম্বর, ২০২৫",
  time: "সকাল ১০:০০ ঘটিকা",
  venue: "বংশ কনভেনশন সেন্টার, আগারগাঁও, ঢাকা",
  organizer: "বংশ ফাউন্ডেশন কমিটি",
  fbPage: "facebook.com/BongshoFoundation",
  whatsapp: "+88017XXXXXXXX"
};

// ৩. প্রিমিয়াম স্টাইলশিট
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Kalpurush',
    backgroundColor: '#ffffff',
    color: '#333'
  },
  container: {
    border: '1px solid #999',
    borderRadius: 5,
    overflow: 'hidden'
  },
  // হেডার সেকশন
  header: {
    backgroundColor: '#2c3e50', // গাঢ় নীল ব্যাকগ্রাউন্ড (প্রিমিয়াম লুক)
    padding: 15,
    color: '#ffffff',
    textAlign: 'center'
  },
  eventName: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: 'bold'
  },
  eventSubInfo: {
    fontSize: 10,
    color: '#ecf0f1'
  },
  // বডি সেকশন
  body: {
    padding: 15,
    flexDirection: 'row',
  },
  leftCol: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px dashed #ccc',
    paddingRight: 10
  },
  rightCol: {
    width: '65%',
    paddingLeft: 15
  },
  qrImage: {
    width: 100,
    height: 100,
    border: '1px solid #ddd',
    padding: 5
  },
  qrText: {
    fontSize: 8,
    marginTop: 5,
    color: '#666'
  },
  // ডেটা রো
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 2
  },
  label: {
    width: 90,
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: 'bold'
  },
  value: {
    flex: 1,
    fontSize: 11,
    color: '#2c3e50'
  },
  redHighlight: {
    color: '#c0392b',
    fontWeight: 'bold'
  },
  greenHighlight: {
    color: '#27ae60',
    fontWeight: 'bold'
  },
  // ফুটার ও শর্তাবলী
  footerSection: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #eee'
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    textDecoration: 'underline'
  },
  termText: {
    fontSize: 8,
    color: '#555',
    marginBottom: 2
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #ddd'
  },
  contactText: {
    fontSize: 8,
    color: '#2980b9'
  },
  // ডিভাইডার (কাটার দাগ)
  dividerContainer: {
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dashedLine: {
    borderBottom: '2px dashed #999',
    width: '100%',
    position: 'absolute',
    top: 6
  },
  scissorText: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    fontSize: 9,
    color: '#555',
    zIndex: 10
  },
  // পার্ট ২ (কুপন)
  couponHeader: {
    backgroundColor: '#e67e22', // কমলা কালার
    padding: 8,
    textAlign: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

// মেইন কম্পোনেন্ট
export const EntryCardDocument = ({ data, qrCodeUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* ==================== পার্ট ১: মূল এন্ট্রি কার্ড ==================== */}
      <View style={styles.container}>
        
        {/* ১. প্রিমিয়াম হেডার */}
        <View style={styles.header}>
          <Text style={styles.eventName}>{EVENT_DETAILS.title}</Text>
          <Text style={styles.eventSubInfo}>তারিখ: {EVENT_DETAILS.date} | সময়: {EVENT_DETAILS.time}</Text>
          <Text style={styles.eventSubInfo}>স্থান: {EVENT_DETAILS.venue}</Text>
        </View>

        <View style={styles.body}>
          {/* বাম পাশ: QR কোড */}
          <View style={styles.leftCol}>
            {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrImage} />}
            <Text style={styles.qrText}>আইডি: {data.id}</Text>
            <Text style={[styles.qrText, { color: 'red', marginTop: 2 }]}>স্ক্যান করুন</Text>
          </View>

          {/* ডান পাশ: বিস্তারিত তথ্য */}
          <View style={styles.rightCol}>
            <View style={styles.row}>
              <Text style={styles.label}>রেজিস্ট্রেশন আইডি:</Text>
              <Text style={[styles.value, styles.redHighlight]}>{data.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>নাম:</Text>
              <Text style={styles.value}>{data.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>মোবাইল:</Text>
              <Text style={styles.value}>{data.mobile}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>গ্রুপ/দল:</Text>
              <Text style={styles.value}>{data.groupName || 'সাধারণ'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>মোট সদস্য:</Text>
              <Text style={styles.value}>{data.totalMembers} জন</Text>
            </View>
            <View style={[styles.row, { borderBottom: 0 }]}>
              <Text style={styles.label}>পেমেন্ট স্ট্যাটাস:</Text>
              <Text style={[styles.value, data.paymentStatus === 'Paid' ? styles.greenHighlight : styles.redHighlight]}>
                {data.paymentStatus === 'Paid' ? 'পরিশোধিত (Paid)' : 'মুলতবি (Pending)'}
              </Text>
            </View>
          </View>
        </View>

        {/* ফুটার ও শর্তাবলী */}
        <View style={styles.footerSection}>
          <Text style={styles.termsTitle}>শর্তাবলী:</Text>
          <Text style={styles.termText}>১. কার্ডটি সাথে রাখা বাধ্যতামূলক।</Text>
          <Text style={styles.termText}>২. একটি কার্ড দিয়ে উল্লিখিত সংখ্যক ব্যক্তিই কেবল প্রবেশ করতে পারবেন।</Text>
          <Text style={styles.termText}>৩. খাবার সংগ্রহের জন্য নিচের কুপনটি সংরক্ষণ করুন।</Text>
          <Text style={styles.termText}>৪. কর্তৃপক্ষের সিদ্ধান্তই চূড়ান্ত।</Text>

          {/* সোশ্যাল লিংক */}
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>আয়োজক: {EVENT_DETAILS.organizer}</Text>
            <Link src={`https://${EVENT_DETAILS.fbPage}`} style={styles.contactText}>
              FB: {EVENT_DETAILS.fbPage}
            </Link>
            <Text style={styles.contactText}>WhatsApp: {EVENT_DETAILS.whatsapp}</Text>
          </View>
        </View>
      </View>

      {/* ==================== ডিভাইডার ==================== */}
      <View style={styles.dividerContainer}>
        <View style={styles.dashedLine} />
        <Text style={styles.scissorText}>✂️ এখান থেকে কেটে খাবার কাউন্টারে জমা দিন ✂️</Text>
      </View>

      {/* ==================== পার্ট ২: ফুড কুপন ==================== */}
      <View style={[styles.container, { marginTop: 0 }]}>
        <View style={styles.couponHeader}>
          <Text>দুপুরের খাবার কুপন (Food Coupon)</Text>
        </View>
        
        <View style={[styles.body, { padding: 10 }]}>
          <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 10 }}>আইডি: <Text style={styles.redHighlight}>{data.id}</Text></Text>
              <Text style={{ fontSize: 10 }}>নাম: {data.name}</Text>
              <Text style={{ fontSize: 10 }}>গ্রুপ: {data.groupName}</Text>
            </View>
            
            <View style={{ alignItems: 'center', marginTop: 5, padding: 5, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>মোট প্যাকেট: {data.totalMembers} টি</Text>
            </View>
          </View>
        </View>
      </View>

    </Page>
  </Document>
);