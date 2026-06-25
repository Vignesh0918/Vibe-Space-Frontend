import React from 'react';
import { 
  Modal, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CustomAlertModal({ visible, onClose, title, message, buttons = [], layout = 'horizontal' }) {
  // If no buttons are provided, default to an "OK" button
  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose }];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertCard}>
              {/* Glow Accent Border */}
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowBorder}
              />
              
              <View style={styles.cardContent}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {message ? <Text style={styles.message}>{message}</Text> : null}
                
                <View style={layout === 'vertical' || alertButtons.length > 2 ? styles.buttonColumn : styles.buttonRow}>
                  {alertButtons.map((btn, index) => {
                    const isDestructive = btn.style === 'destructive';
                    const isCancel = btn.style === 'cancel';
                    const isPrimary = btn.style === 'primary' || btn.primary || alertButtons.length === 1 || (!isCancel && !isDestructive && !btn.style && index === 0);
                    
                    let btnStyle = layout === 'vertical' || alertButtons.length > 2 ? styles.verticalButton : styles.button;
                    let textStyle = styles.buttonText;
                    
                    if (isDestructive) {
                      btnStyle = [btnStyle, styles.destructiveBtn];
                      textStyle = [styles.buttonText, styles.destructiveText];
                    } else if (isCancel) {
                      btnStyle = [btnStyle, styles.cancelBtn];
                      textStyle = [styles.buttonText, styles.cancelText];
                    } else if (isPrimary) {
                      // Primary action button gets gradient style
                      return (
                        <TouchableOpacity
                          key={index}
                          style={layout === 'vertical' || alertButtons.length > 2 ? styles.verticalPrimaryBtnTouch : styles.primaryBtnTouch}
                          activeOpacity={0.8}
                          onPress={() => {
                            onClose();
                            if (typeof btn.onPress === 'function') {
                              btn.onPress();
                            }
                          }}
                        >
                          <LinearGradient
                            colors={['#8b5cf6', '#4f6ef7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={layout === 'vertical' || alertButtons.length > 2 ? styles.verticalPrimaryBtnGradient : styles.primaryBtnGradient}
                          >
                            {btn.icon && (
                              <Ionicons 
                                name={btn.icon} 
                                size={18} 
                                color="#ffffff" 
                                style={{ marginRight: 8 }} 
                              />
                            )}
                            <Text style={styles.primaryBtnText}>{btn.text}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        style={btnStyle}
                        activeOpacity={0.8}
                        onPress={() => {
                          onClose();
                          if (typeof btn.onPress === 'function') {
                            btn.onPress();
                          }
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          {btn.icon && (
                            <Ionicons 
                              name={btn.icon} 
                              size={18} 
                              color={isDestructive ? '#f87171' : (isCancel ? 'rgba(255,255,255,0.45)' : '#ffffff')} 
                              style={{ marginRight: 8 }} 
                            />
                          )}
                          <Text style={textStyle}>{btn.text}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 3, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertCard: {
    width: width - 48,
    maxWidth: 340,
    backgroundColor: '#1c0830',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBorder: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verticalButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  destructiveText: {
    color: '#f87171',
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  primaryBtnTouch: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  verticalPrimaryBtnTouch: {
    width: '100%',
    marginVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalPrimaryBtnGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
