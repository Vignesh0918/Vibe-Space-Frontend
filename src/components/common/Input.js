/**
 * Input.js
 * Dark-themed text inputs supporting normal text, passwords, phone numbers,
 * and a custom 6-digit OTP layout with auto-focus shifting.
 */

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function Input({
  placeholder,
  value,
  onChangeText,
  type = 'text',
  icon = null,
  error = null,
  label = null,
  ...rest
}) {
  // If the input type is OTP, render 6 individual input fields side-by-side
  if (type === 'otp') {
    const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    const [pin, setPin] = useState(Array(6).fill(''));

    // Sync external value updates
    useEffect(() => {
      if (value !== undefined) {
        const valStr = String(value || '');
        const newPin = Array(6).fill('');
        for (let i = 0; i < Math.min(valStr.length, 6); i++) {
          newPin[i] = valStr[i];
        }
        setPin(newPin);
      }
    }, [value]);

    const handlePinChange = (text, index) => {
      const newPin = [...pin];
      // Capture only the last character typed
      const cleanText = text.slice(-1);
      newPin[index] = cleanText;
      setPin(newPin);

      // Notify parent container
      const combinedVal = newPin.join('');
      if (onChangeText) {
        onChangeText(combinedVal);
      }

      // Auto-focus next input box
      if (cleanText && index < 5) {
        pinRefs[index + 1].current.focus();
      }
    };

    const handleKeyPress = (e, index) => {
      if (e.nativeEvent.key === 'Backspace') {
        // If current cell is empty, clear and focus the previous input cell
        if (!pin[index] && index > 0) {
          const newPin = [...pin];
          newPin[index - 1] = '';
          setPin(newPin);
          if (onChangeText) {
            onChangeText(newPin.join(''));
          }
          pinRefs[index - 1].current.focus();
        }
      }
    };

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.otpRow}>
          {Array(6).fill(0).map((_, index) => (
            <TextInput
              key={index}
              ref={pinRefs[index]}
              style={[
                styles.otpBox,
                pin[index] ? styles.activeOtpBox : null,
                error ? styles.errorBox : null
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={pin[index]}
              onChangeText={(text) => handlePinChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              placeholder="-"
              placeholderTextColor={COLORS.textMuted}
              {...rest}
            />
          ))}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Otherwise render a standard input box
  const isPassword = type === 'password';
  const keyboardType = type === 'phone' ? 'phone-pad' : 'default';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        error ? styles.inputWrapperError : null
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          {...rest}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacingMd,
    width: '100%',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    ...FONTS.medium,
    marginBottom: SIZES.spacingXs,
  },
  inputWrapper: {
    backgroundColor: COLORS.input,
    height: SIZES.inputHeight,
    borderRadius: SIZES.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacingMd,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
  },
  iconContainer: {
    marginRight: SIZES.spacingSm,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: SIZES.md,
    ...FONTS.regular,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: SIZES.xs,
    marginTop: SIZES.spacingXs,
    marginLeft: SIZES.spacingXs,
  },
  // OTP Styles
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 48,
    height: 52,
    backgroundColor: COLORS.input,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    color: '#ffffff',
    fontSize: SIZES.xl,
    ...FONTS.bold,
    textAlign: 'center',
  },
  activeOtpBox: {
    borderColor: COLORS.primary,
  },
  errorBox: {
    borderColor: COLORS.danger,
  },
});
