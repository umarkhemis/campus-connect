

import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface Props {
  name: string;
  description: string;
  category: string;
  joined: boolean;
  onToggleJoin: () => void;
  memberCount?: number;
  loading?: boolean;
  onViewMembers?: () => void;
}

const ClubCard = ({ 
  name, 
  description, 
  category, 
  joined, 
  onToggleJoin, 
  memberCount,
  loading = false,
  onViewMembers
}: Props) => {
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case 'sports':
        return 'football-outline';
      case 'academic':
      case 'education':
        return 'school-outline';
      case 'tech':
      case 'technology':
        return 'code-slash-outline';
      case 'fun':
      case 'entertainment':
        return 'happy-outline';
      case 'academics':
      case 'academic':
      case 'education':
        return 'school-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case 'sports':
        return '#e74c3c';
      case 'academic':
      case 'education':
        return '#3498db';
      case 'tech':
      case 'technology':
        return '#9b59b6';
      case 'fun':
      case 'entertainment':
        return '#f39c12';
      case 'academics':
      case 'academic':
      case 'education':
        return '#3498db';
      default:
        return '#7f8c8d';
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const isActive = joined;

  return (
    <View style={[styles.card, !isActive && styles.cardInactive]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
            {joined && (
              <View style={styles.joinedBadge}>
                <Icon name="checkmark-circle" size={16} color="#27ae60" />
                <Text style={styles.joinedText}>Joined</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) + '15' }]}>
              <Icon 
                name={getCategoryIcon(category)} 
                size={14} 
                color={getCategoryColor(category)} 
              />
              <Text style={[styles.categoryText, { color: getCategoryColor(category) }]}>
                {category}
              </Text>
            </View>
            
            {memberCount !== undefined && (
              <TouchableOpacity 
                style={styles.memberCount}
                onPress={onViewMembers}
                disabled={!onViewMembers}
              >
                <Icon name="people-outline" size={14} color="#7f8c8d" />
                <Text style={styles.memberCountText}>
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </Text>
                {onViewMembers && (
                  <Icon name="chevron-forward" size={14} color="#7f8c8d" style={styles.chevron} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {truncateText(description, 120)}
      </Text>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            joined ? styles.leaveButton : styles.joinButton,
            loading && styles.buttonDisabled
          ]}
          onPress={onToggleJoin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon 
                name={joined ? "remove-circle-outline" : "add-circle-outline"} 
                size={18} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {joined ? "Leave Club" : "Join Club"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoButton}
          onPress={onViewMembers}
          disabled={!onViewMembers}
        >
          <Icon name="people" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  memberCountText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 4,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5a6c7d',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginRight: 12,
  },
  joinButton: {
    backgroundColor: '#667eea',
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#667eea' + '10',
  },
});

export default ClubCard;


























































// import React from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   StyleSheet, 
//   ActivityIndicator,
//   Dimensions 
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';

// const { width } = Dimensions.get('window');

// interface Props {
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
//   onToggleJoin: () => void;
//   memberCount?: number;
//   loading?: boolean;
//   isActive?: boolean;
//   createdAt?: string;
// }

// const ClubCard = ({ 
//   name, 
//   description, 
//   category, 
//   joined, 
//   onToggleJoin, 
//   memberCount,
//   loading = false,
//   isActive = true 
// }: Props) => {
//   const getCategoryIcon = (category: string): string => {
//     const categoryLower = category.toLowerCase();
//     switch (categoryLower) {
//       case 'sports':
//         return 'football-outline';
//       case 'academic':
//       case 'education':
//         return 'school-outline';
//       case 'technology':
//       case 'tech':
//         return 'code-slash-outline';
//       case 'arts':
//       case 'creative':
//         return 'brush-outline';
//       case 'music':
//         return 'musical-notes-outline';
//       case 'social':
//         return 'people-outline';
//       case 'volunteer':
//       case 'community':
//         return 'heart-outline';
//       case 'business':
//         return 'briefcase-outline';
//       case 'health':
//       case 'fitness':
//         return 'fitness-outline';
//       case 'gaming':
//         return 'game-controller-outline';
//       default:
//         return 'ellipse-outline';
//     }
//   };

//   const getCategoryColor = (category: string): string => {
//     const categoryLower = category.toLowerCase();
//     switch (categoryLower) {
//       case 'sports':
//         return '#e74c3c';
//       case 'academic':
//       case 'education':
//         return '#3498db';
//       case 'technology':
//       case 'tech':
//         return '#9b59b6';
//       case 'arts':
//       case 'creative':
//         return '#e67e22';
//       case 'music':
//         return '#f39c12';
//       case 'social':
//         return '#1abc9c';
//       case 'volunteer':
//       case 'community':
//         return '#27ae60';
//       case 'business':
//         return '#34495e';
//       case 'health':
//       case 'fitness':
//         return '#16a085';
//       case 'gaming':
//         return '#8e44ad';
//       default:
//         return '#7f8c8d';
//     }
//   };

//   const truncateText = (text: string, maxLength: number): string => {
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength).trim() + '...';
//   };

//   return (
//     <View style={[styles.card, !isActive && styles.cardInactive]}>
//       {/* Header Row */}
//       <View style={styles.header}>
//         <View style={styles.titleSection}>
//           <View style={styles.titleRow}>
//             <Text style={styles.title} numberOfLines={1}>
//               {name}
//             </Text>
//             {joined && (
//               <View style={styles.joinedBadge}>
//                 <Icon name="checkmark-circle" size={16} color="#27ae60" />
//                 <Text style={styles.joinedText}>Joined</Text>
//               </View>
//             )}
//           </View>
          
//           <View style={styles.metaRow}>
//             <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) + '15' }]}>
//               <Icon 
//                 name={getCategoryIcon(category)} 
//                 size={14} 
//                 color={getCategoryColor(category)} 
//               />
//               <Text style={[styles.categoryText, { color: getCategoryColor(category) }]}>
//                 {category}
//               </Text>
//             </View>
            
//             {memberCount !== undefined && (
//               <View style={styles.memberCount}>
//                 <Icon name="people-outline" size={14} color="#7f8c8d" />
//                 <Text style={styles.memberCountText}>
//                   {memberCount} member{memberCount !== 1 ? 's' : ''}
//                 </Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </View>

//       {/* Description */}
//       <Text style={styles.description} numberOfLines={2}>
//         {truncateText(description, 120)}
//       </Text>

//       {/* Actions Row */}
//       <View style={styles.actionsRow}>
//         <TouchableOpacity
//           style={[
//             styles.actionButton,
//             joined ? styles.leaveButton : styles.joinButton,
//             loading && styles.buttonDisabled
//           ]}
//           onPress={onToggleJoin}
//           disabled={loading || !isActive}
//           activeOpacity={0.8}
//         >
//           {loading ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <>
//               <Icon 
//                 name={joined ? "remove-circle-outline" : "add-circle-outline"} 
//                 size={18} 
//                 color="#fff" 
//               />
//               <Text style={styles.actionButtonText}>
//                 {joined ? "Leave Club" : "Join Club"}
//               </Text>
//             </>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.infoButton}>
//           <Icon name="information-circle-outline" size={20} color="#667eea" />
//         </TouchableOpacity>
//       </View>

//       {/* Status Indicator */}
//       {!isActive && (
//         <View style={styles.inactiveOverlay}>
//           <Text style={styles.inactiveText}>Temporarily Unavailable</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     marginVertical: 6,
//     marginHorizontal: 2,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f0f0f0',
//   },
//   cardInactive: {
//     opacity: 0.7,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   titleSection: {
//     flex: 1,
//   },
//   titleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     flex: 1,
//     marginRight: 8,
//   },
//   joinedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#27ae60' + '15',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   joinedText: {
//     fontSize: 12,
//     color: '#27ae60',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   categoryBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginRight: 12,
//     marginBottom: 4,
//   },
//   categoryText: {
//     fontSize: 13,
//     fontWeight: '600',
//     marginLeft: 4,
//     textTransform: 'capitalize',
//   },
//   memberCount: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   memberCountText: {
//     fontSize: 13,
//     color: '#7f8c8d',
//     marginLeft: 4,
//     fontWeight: '500',
//   },
//   description: {
//     fontSize: 15,
//     lineHeight: 22,
//     color: '#5a6c7d',
//     marginBottom: 16,
//   },
//   actionsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 25,
//     marginRight: 12,
//   },
//   joinButton: {
//     backgroundColor: '#667eea',
//   },
//   leaveButton: {
//     backgroundColor: '#e74c3c',
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   infoButton: {
//     padding: 12,
//     borderRadius: 25,
//     backgroundColor: '#667eea' + '10',
//   },
//   inactiveOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.1)',
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   inactiveText: {
//     color: '#7f8c8d',
//     fontSize: 14,
//     fontWeight: '600',
//     backgroundColor: '#fff',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
// });

// export default ClubCard;

























































// components/ClubCard.tsx
// import React from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// interface Props {
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
//   onToggleJoin: () => void;
// }

// const ClubCard = ({ name, description, category, joined, onToggleJoin }: Props) => (
//   <View style={styles.card}>
//     <Text style={styles.title}>{name}</Text>
//     <Text>{category}</Text>
//     <Text>{description}</Text>
//     <Button title={joined ? "Leave" : "Join"} onPress={onToggleJoin} />
//   </View>
// );

// const styles = StyleSheet.create({
//   card: { margin: 10, padding: 10, borderWidth: 1, borderRadius: 6 },
//   title: { fontWeight: 'bold', fontSize: 16 },
// });

// export default ClubCard;
