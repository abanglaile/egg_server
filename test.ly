\version "2.18.2"
#(set! paper-alist (cons '("my size" . (cons (* 95 mm) (* 75 mm))) paper-alist))

\header { 
  tagline = ""  % removed 
} 

\paper {
  #(set-paper-size "my size")
}
\layout {
  \context {
    \Staff
    \remove "Time_signature_engraver"
  }
}
{
\time 8/4
\clef treble
s1 a1\bar"||"
 }
\layout {
  indent = 0
  \context {
    \Staff
    \remove "Time_signature_engraver"
  }
\context {
    \Score
    \remove "Bar_number_engraver"
  }
}
{
\time 4/4
\clef treble
g1  a b  c' d' |
\break
e' f' g' a' b' |
\break
c''  d'' e'' f'' g''\bar "||"
}
 \addlyrics {
    A B C D E F G H I J K L M N O 
  }